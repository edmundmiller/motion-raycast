import { ActionPanel, List, Action, Icon, showToast, Toast, Color } from "@raycast/api";
import { useState, useEffect } from "react";
import { getTasks, MotionTask } from "./motion-api";

interface State {
  tasks: MotionTask[];
  isLoading: boolean;
  error?: Error;
}

export default function Command() {
  const [state, setState] = useState<State>({
    tasks: [],
    isLoading: true,
  });

  useEffect(() => {
    async function fetchTasks() {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: undefined }));
        const response = await getTasks();
        setState((prev) => ({ ...prev, tasks: response.tasks, isLoading: false }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error : new Error("Unknown error"),
          isLoading: false,
        }));
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to load tasks",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    fetchTasks();
  }, []);

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "ASAP":
        return { source: Icon.ExclamationMark, tintColor: Color.Red };
      case "HIGH":
        return { source: Icon.ArrowUp, tintColor: Color.Orange };
      case "MEDIUM":
        return { source: Icon.Minus, tintColor: Color.Yellow };
      case "LOW":
        return { source: Icon.ArrowDown, tintColor: Color.Blue };
      default:
        return Icon.Circle;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return undefined;
    return new Date(dateString).toLocaleDateString();
  };

  const getTaskSubtitle = (task: MotionTask) => {
    const parts = [];
    if (task.project?.Name) parts.push(task.project.Name);
    if (task.status?.name) parts.push(task.status.name);
    if (task.dueDate) parts.push(`Due: ${formatDate(task.dueDate)}`);
    return parts.join(" • ");
  };

  const getTaskAccessories = (task: MotionTask) => {
    const accessories = [];
    
    if (task.completed) {
      accessories.push({ icon: Icon.CheckCircle, tintColor: Color.Green });
    }
    
    if (task.schedulingIssue) {
      accessories.push({ icon: Icon.Warning, tintColor: Color.Red });
    }
    
    if (task.assignees.length > 0) {
      accessories.push({ text: task.assignees.map(a => a.name).join(", ") });
    }
    
    return accessories;
  };

  return (
    <List isLoading={state.isLoading} searchBarPlaceholder="Search Motion tasks...">
      {state.tasks.map((task) => (
        <List.Item
          key={task.id}
          icon={getPriorityIcon(task.priority)}
          title={task.name}
          subtitle={getTaskSubtitle(task)}
          accessories={getTaskAccessories(task)}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser
                title="Open in Motion"
                url={`https://app.usemotion.com/tasks/${task.id}`}
              />
              <Action.CopyToClipboard
                title="Copy Task Name"
                content={task.name}
                shortcut={{ modifiers: ["cmd"], key: "c" }}
              />
              <Action.CopyToClipboard
                title="Copy Task ID"
                content={task.id}
                shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
              />
            </ActionPanel>
          }
        />
      ))}
      {!state.isLoading && state.tasks.length === 0 && (
        <List.EmptyView
          icon={Icon.Document}
          title="No tasks found"
          description="You don't have any tasks in Motion or they couldn't be loaded."
        />
      )}
    </List>
  );
}
