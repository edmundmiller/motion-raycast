import { ActionPanel, Detail, List, Action, Icon, showToast, Toast, Clipboard, Color } from "@raycast/api";
import { getProgressIcon } from "@raycast/utils";
import { useState, useEffect } from "react";
import { getWorkspaces, getProjects, getTasks, MotionWorkspace, MotionProject, MotionTask } from "./motion-api";

interface ProjectWithWorkspace extends MotionProject {
  workspace: MotionWorkspace;
}

export default function SearchProject() {
  const [projects, setProjects] = useState<ProjectWithWorkspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    async function loadProjects() {
      try {
        console.log("🔄 Loading projects...");

        // Get workspaces first
        const workspaces = await getWorkspaces();

        // Get projects for each workspace
        const allProjects: ProjectWithWorkspace[] = [];

        for (const workspace of workspaces) {
          try {
            const workspaceProjects = await getProjects(workspace.id);
            const projectsWithWorkspace = workspaceProjects.map((project) => ({
              ...project,
              workspace,
            }));
            allProjects.push(...projectsWithWorkspace);
          } catch (error) {
            console.error(`Failed to load projects for workspace ${workspace.name}:`, error);
          }
        }

        setProjects(allProjects);
        console.log(`✅ Loaded ${allProjects.length} projects from ${workspaces.length} workspaces`);
      } catch (error) {
        console.error("❌ Failed to load projects:", error);
        await showToast({
          style: Toast.Style.Failure,
          title: "Failed to Load Projects",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadProjects();
  }, []);

  // Helper function to determine if a project is active (not completed/cancelled)
  function isActiveProject(project: MotionProject): boolean {
    if (!project.status) return true; // If no status, assume active

    const statusName = project.status.name.toLowerCase();

    // Filter out completed, cancelled, done, finished, archived projects
    const inactiveStatuses = [
      "completed",
      "complete",
      "done",
      "finished",
      "cancelled",
      "canceled",
      "archived",
      "closed",
      "resolved",
      "ended",
    ];

    return !inactiveStatuses.some((inactive) => statusName.includes(inactive)) && !project.status.isResolvedStatus;
  }

  // Helper function to get project priority for sorting
  function getProjectProgressIcon(project: MotionProject) {
    const statusName = project.status?.name.toLowerCase() || "";
    
    // Completed/Done projects
    if (statusName.includes("completed") || 
        statusName.includes("complete") || 
        statusName.includes("done") || 
        statusName.includes("finished") ||
        project.status?.isResolvedStatus) {
      return getProgressIcon(1.0, Color.Green);
    }
    
    // In Progress projects - calculate based on time since creation
    if (statusName.includes("progress") || 
        statusName.includes("active") || 
        statusName.includes("current")) {
      
      const now = new Date();
      const createdTime = new Date(project.createdTime);
      const updatedTime = new Date(project.updatedTime);
      
      // If recently updated (within 7 days), show higher progress
      const daysSinceUpdate = (now.getTime() - updatedTime.getTime()) / (1000 * 60 * 60 * 24);
      const daysSinceCreation = (now.getTime() - createdTime.getTime()) / (1000 * 60 * 60 * 24);
      
      let progress = 0.3; // Base progress for in-progress projects
      
      // Increase progress based on activity (recent updates)
      if (daysSinceUpdate < 1) progress = 0.8;
      else if (daysSinceUpdate < 3) progress = 0.6;
      else if (daysSinceUpdate < 7) progress = 0.5;
      
      // Adjust based on age of project
      if (daysSinceCreation > 30) progress = Math.min(progress + 0.2, 0.9);
      
      return getProgressIcon(progress, Color.Orange);
    }
    
    // Todo/Planned projects
    if (statusName.includes("todo") || 
        statusName.includes("planned") || 
        statusName.includes("ready") || 
        statusName.includes("next") ||
        project.status?.isDefaultStatus) {
      return getProgressIcon(0.1, Color.Blue);
    }
    
    // Backlog projects
    if (statusName.includes("backlog") || 
        statusName.includes("future") || 
        statusName.includes("someday")) {
      return getProgressIcon(0.05, Color.SecondaryText);
    }
    
    // Default for unknown statuses
    return getProgressIcon(0.2, Color.SecondaryText);
  }

  function getProjectSortPriority(project: MotionProject): number {
    if (!project.status) return 3; // Default priority for projects without status

    const statusName = project.status.name.toLowerCase();

    // Priority order: in-progress (1), todo/planned (2), backlog (3), others (4)
    if (statusName.includes("progress") || statusName.includes("active") || statusName.includes("current")) {
      return 1; // In Progress - highest priority
    }
    if (
      statusName.includes("todo") ||
      statusName.includes("planned") ||
      statusName.includes("ready") ||
      statusName.includes("next")
    ) {
      return 2; // Todo/Planned - second priority
    }
    if (statusName.includes("backlog") || statusName.includes("future") || statusName.includes("someday")) {
      return 3; // Backlog - third priority
    }

    // For default status, put it in todo category
    if (project.status.isDefaultStatus) {
      return 2;
    }

    return 4; // Other statuses - lowest priority
  }

  // Filter and sort projects
  const filteredAndSortedProjects = projects
    .filter((project) => {
      // First filter by active status
      if (!isActiveProject(project)) return false;

      // Then filter by search text
      if (!searchText) return true;

      const searchLower = searchText.toLowerCase();
      return (
        project.name.toLowerCase().includes(searchLower) ||
        project.description.toLowerCase().includes(searchLower) ||
        project.workspace.name.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      // Sort by priority first
      const priorityA = getProjectSortPriority(a);
      const priorityB = getProjectSortPriority(b);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // If same priority, sort by updated date (most recent first)
      return new Date(b.updatedTime).getTime() - new Date(a.updatedTime).getTime();
    });

  async function copyProjectId(project: MotionProject) {
    await Clipboard.copy(project.id);
    await showToast({
      style: Toast.Style.Success,
      title: "Copied Project ID",
      message: `"${project.name}" ID copied to clipboard`,
    });
  }

  async function copyProjectName(project: MotionProject) {
    await Clipboard.copy(project.name);
    await showToast({
      style: Toast.Style.Success,
      title: "Copied Project Name",
      message: `"${project.name}" copied to clipboard`,
    });
  }

  function getProjectStatusIcon(project: MotionProject): string {
    if (!project.status) return "📋";

    const statusName = project.status.name.toLowerCase();

    // In Progress projects
    if (statusName.includes("progress") || statusName.includes("active") || statusName.includes("current")) {
      return "🚀"; // In Progress
    }

    // Todo/Planned projects
    if (
      statusName.includes("todo") ||
      statusName.includes("planned") ||
      statusName.includes("ready") ||
      statusName.includes("next")
    ) {
      return "📝"; // Todo/Planned
    }

    // Backlog projects
    if (statusName.includes("backlog") || statusName.includes("future") || statusName.includes("someday")) {
      return "📚"; // Backlog
    }

    // Default status
    if (project.status.isDefaultStatus) {
      return "📝"; // Treat default as todo
    }

    return "📋"; // Other statuses
  }

  function getProjectStatusSection(project: MotionProject): string {
    const priority = getProjectSortPriority(project);

    switch (priority) {
      case 1:
        return "🚀 In Progress";
      case 2:
        return "📝 Todo & Planned";
      case 3:
        return "📚 Backlog";
      default:
        return "📋 Other";
    }
  }

  function formatProjectDescription(description: string): string {
    // Remove HTML tags and decode HTML entities for display
    return description
      .replace(/<[^>]*>/g, "") // Remove HTML tags
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .trim();
  }

  function ProjectTasks({ project }: { project: ProjectWithWorkspace }) {
    const [tasks, setTasks] = useState<MotionTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchText, setSearchText] = useState("");

    useEffect(() => {
      async function loadTasks() {
        try {
          setIsLoading(true);
          console.log(`🔄 Loading tasks for project: ${project.name} (${project.id})`);
          
          const response = await getTasks({ projectId: project.id });
          setTasks(response.tasks);
          
          console.log(`✅ Loaded ${response.tasks.length} tasks for project ${project.name}`);
        } catch (error) {
          console.error("❌ Failed to load project tasks:", error);
          await showToast({
            style: Toast.Style.Failure,
            title: "Failed to Load Tasks",
            message: error instanceof Error ? error.message : "Unknown error",
          });
        } finally {
          setIsLoading(false);
        }
      }

      loadTasks();
    }, [project.id]);

    function getTaskIcon(task: MotionTask): string {
      if (task.completed || task.status?.isResolvedStatus) {
        return "✅";
      }
      
      switch (task.priority) {
        case "ASAP":
          return "🔴";
        case "HIGH":
          return "🟠";
        case "MEDIUM":
          return "🟡";
        case "LOW":
          return "🟢";
        default:
          return "📝";
      }
    }

    function getTaskProgressIcon(task: MotionTask) {
      if (task.completed || task.status?.isResolvedStatus) {
        return getProgressIcon(1.0, Color.Green);
      }
      
      const now = new Date();
      const created = new Date(task.createdTime);
      const daysSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      
      // If task has a due date, calculate urgency
      if (task.dueDate) {
        const due = new Date(task.dueDate);
        const daysUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysUntilDue < 0) {
          return getProgressIcon(0.9, Color.Red); // Overdue
        } else if (daysUntilDue < 1) {
          return getProgressIcon(0.8, Color.Orange); // Due soon
        } else if (daysUntilDue < 3) {
          return getProgressIcon(0.6, Color.Yellow); // Due this week
        }
      }
      
      // Base progress on priority and age
      let progress = 0.3;
      switch (task.priority) {
        case "ASAP":
          progress = 0.8;
          break;
        case "HIGH":
          progress = 0.6;
          break;
        case "MEDIUM":
          progress = 0.4;
          break;
        case "LOW":
          progress = 0.2;
          break;
      }
      
      return getProgressIcon(progress, Color.Blue);
    }

    // Filter tasks by search text
    const filteredTasks = tasks.filter((task) => {
      if (!searchText) return true;
      
      const searchLower = searchText.toLowerCase();
      return (
        task.name.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower)
      );
    });

    // Sort tasks: incomplete first, then by priority, then by due date
    const sortedTasks = filteredTasks.sort((a, b) => {
      // Completed tasks go to bottom
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      
      // Sort by priority
      const priorityOrder = { "ASAP": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3 };
      const aPriority = priorityOrder[a.priority] ?? 4;
      const bPriority = priorityOrder[b.priority] ?? 4;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // Sort by due date (tasks with due dates first)
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      
      // Finally sort by creation date (newest first)
      return new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime();
    });

    async function copyTaskId(task: MotionTask) {
      await Clipboard.copy(task.id);
      await showToast({
        style: Toast.Style.Success,
        title: "Copied Task ID",
        message: `"${task.name}" ID copied to clipboard`,
      });
    }

    function formatTaskAccessories(task: MotionTask) {
      const accessories = [];
      
      if (task.priority !== "MEDIUM") {
        accessories.push({ text: task.priority });
      }
      
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const now = new Date();
        const isOverdue = dueDate < now;
        const isToday = dueDate.toDateString() === now.toDateString();
        const isTomorrow = dueDate.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
        
        let dueDateText = dueDate.toLocaleDateString();
        if (isToday) dueDateText = "Today";
        else if (isTomorrow) dueDateText = "Tomorrow";
        else if (isOverdue) dueDateText = `Overdue (${dueDate.toLocaleDateString()})`;
        
        accessories.push({ 
          text: dueDateText,
          icon: isOverdue ? Icon.ExclamationMark : (isToday || isTomorrow) ? Icon.Clock : undefined
        });
      }
      
      if (task.assignees.length > 0) {
        accessories.push({ text: task.assignees[0].name });
      }
      
      return accessories;
    }

    return (
      <List
        isLoading={isLoading}
        searchText={searchText}
        onSearchTextChange={setSearchText}
        searchBarPlaceholder="Search tasks..."
        navigationTitle={`${project.name} Tasks`}
        throttle
      >
        {sortedTasks.length === 0 && !isLoading && (
          <List.EmptyView
            icon={Icon.CheckCircle}
            title="No Tasks Found"
            description={searchText ? "Try adjusting your search terms" : "This project has no tasks"}
          />
        )}

        {sortedTasks.map((task) => (
          <List.Item
            key={task.id}
            icon={getTaskProgressIcon(task)}
            title={task.name}
            subtitle={task.description || undefined}
            accessories={formatTaskAccessories(task)}
            actions={
              <ActionPanel>
                <ActionPanel.Section title="Task Actions">
                  <Action
                    title="Copy Task ID"
                    onAction={() => copyTaskId(task)}
                    icon={Icon.Clipboard}
                    shortcut={{ modifiers: ["cmd"], key: "c" }}
                  />
                  <Action.CopyToClipboard
                    title="Copy Task Name"
                    content={task.name}
                    shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                  />
                </ActionPanel.Section>
                <ActionPanel.Section title="Project Actions">
                  <Action.Push 
                    title="Show Project Details" 
                    target={<ProjectDetail project={project} />} 
                    icon={Icon.Eye}
                    shortcut={{ modifiers: ["cmd"], key: "p" }}
                  />
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        ))}
      </List>
    );
  }

  function ProjectDetail({ project }: { project: ProjectWithWorkspace }) {
    const formattedDescription = formatProjectDescription(project.description);

    const markdown = `
# ${project.name}

**Workspace:** ${project.workspace.name}
**Status:** ${project.status?.name || "No status"}
**Created:** ${new Date(project.createdTime).toLocaleDateString()}
**Updated:** ${new Date(project.updatedTime).toLocaleDateString()}

## Description

${formattedDescription || "No description available"}

---

**Project ID:** \`${project.id}\`
**Workspace ID:** \`${project.workspaceId}\`
    `;

    return (
      <Detail
        markdown={markdown}
        actions={
          <ActionPanel>
            <Action.Push
              title="Show Project Tasks"
              target={<ProjectTasks project={project} />}
              icon={Icon.List}
              shortcut={{ modifiers: ["cmd"], key: "t" }}
            />
            <ActionPanel.Section title="Copy">
              <Action.CopyToClipboard
                title="Copy Project ID"
                content={project.id}
                shortcut={{ modifiers: ["cmd"], key: "c" }}
              />
              <Action.CopyToClipboard
                title="Copy Project Name"
                content={project.name}
                shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
              />
              <Action.CopyToClipboard
                title="Copy Workspace ID"
                content={project.workspaceId}
                shortcut={{ modifiers: ["cmd", "opt"], key: "c" }}
              />
            </ActionPanel.Section>
          </ActionPanel>
        }
      />
    );
  }

  // Group projects by section for better organization
  const projectSections = filteredAndSortedProjects.reduce(
    (acc, project) => {
      const section = getProjectStatusSection(project);
      if (!acc[section]) {
        acc[section] = [];
      }
      acc[section].push(project);
      return acc;
    },
    {} as Record<string, ProjectWithWorkspace[]>,
  );

  return (
    <List
      isLoading={isLoading}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search active projects by name, description, or workspace..."
      throttle
    >
      {filteredAndSortedProjects.length === 0 && !isLoading && (
        <List.EmptyView
          icon={Icon.MagnifyingGlass}
          title="No Active Projects Found"
          description={searchText ? "Try adjusting your search terms" : "No active projects available"}
        />
      )}

      {Object.entries(projectSections).map(([sectionTitle, sectionProjects]) => (
        <List.Section key={sectionTitle} title={sectionTitle}>
          {sectionProjects.map((project) => (
            <List.Item
              key={project.id}
              icon={getProjectProgressIcon(project)}
              title={project.name}
              subtitle={project.workspace.name}
              accessories={[
                { text: project.status?.name || "No status" },
                { text: new Date(project.updatedTime).toLocaleDateString() },
              ]}
              actions={
                <ActionPanel>
                  <Action.Push 
                    title="Show Project Tasks" 
                    target={<ProjectTasks project={project} />} 
                    icon={Icon.List} 
                  />
                  <Action.Push 
                    title="Show Project Details" 
                    target={<ProjectDetail project={project} />} 
                    icon={Icon.Eye}
                    shortcut={{ modifiers: ["cmd"], key: "d" }}
                  />
                  <ActionPanel.Section title="Copy">
                    <Action
                      title="Copy Project ID"
                      onAction={() => copyProjectId(project)}
                      icon={Icon.Clipboard}
                      shortcut={{ modifiers: ["cmd"], key: "c" }}
                    />
                    <Action
                      title="Copy Project Name"
                      onAction={() => copyProjectName(project)}
                      icon={Icon.Clipboard}
                      shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                    />
                  </ActionPanel.Section>
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ))}
    </List>
  );
}
