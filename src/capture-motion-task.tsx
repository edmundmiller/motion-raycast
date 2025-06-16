import { Form, ActionPanel, Action, showToast, Toast, useNavigation } from "@raycast/api";
import { useState, useEffect } from "react";
import { createTask, getUser, getWorkspaces, getProjects, MotionWorkspace, MotionProject } from "./motion-api";

interface TaskFormValues {
  name: string;
  description: string;
  priority: "ASAP" | "HIGH" | "MEDIUM" | "LOW";
  dueDate: Date | null;
  deadlineType: "HARD" | "SOFT" | "NONE";
  duration: string;
  workspaceId: string;
  projectId: string;
}

export default function CaptureMotionTask() {
  const [isLoading, setIsLoading] = useState(false);
  const [workspaces, setWorkspaces] = useState<MotionWorkspace[]>([]);
  const [projects, setProjects] = useState<MotionProject[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");
  const [isLoadingData, setIsLoadingData] = useState(true);
  const { pop } = useNavigation();

  // Load workspaces on component mount
  useEffect(() => {
    async function loadWorkspaces() {
      try {
        console.log("🔄 Loading workspaces...");
        const workspaceList = await getWorkspaces();
        setWorkspaces(workspaceList);
        
        // Set default workspace
        if (workspaceList.length > 0) {
          setSelectedWorkspaceId(workspaceList[0].id);
        }
        
        console.log("✅ Loaded workspaces:", workspaceList.length);
      } catch (error) {
        console.error("❌ Failed to load workspaces:", error);
        await showToast({
          style: Toast.Style.Failure,
          title: "Failed to Load Workspaces",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setIsLoadingData(false);
      }
    }
    
    loadWorkspaces();
  }, []);

  // Load projects when workspace changes
  useEffect(() => {
    async function loadProjects() {
      if (!selectedWorkspaceId) {
        setProjects([]);
        return;
      }
      
      try {
        console.log("🔄 Loading projects for workspace:", selectedWorkspaceId);
        const projectList = await getProjects(selectedWorkspaceId);
        setProjects(projectList);
        console.log("✅ Loaded projects:", projectList.length);
      } catch (error) {
        console.error("❌ Failed to load projects:", error);
        setProjects([]);
      }
    }
    
    loadProjects();
  }, [selectedWorkspaceId]);

  async function handleSubmit(values: TaskFormValues) {
    setIsLoading(true);
    
    try {
      console.log("Creating task with values:", values);
      
      // Prepare task data
      const taskData: any = {
        name: values.name,
        priority: values.priority,
        workspaceId: values.workspaceId || selectedWorkspaceId,
      };

      // Add optional fields only if they have values
      if (values.description?.trim()) {
        taskData.description = values.description.trim();
      }

      if (values.projectId) {
        taskData.projectId = values.projectId;
      }

      if (values.dueDate) {
        taskData.dueDate = values.dueDate.toISOString();
      }

      if (values.deadlineType && values.deadlineType !== "SOFT") {
        taskData.deadlineType = values.deadlineType;
      }

      if (values.duration && values.duration !== "") {
        if (values.duration === "NONE" || values.duration === "REMINDER") {
          taskData.duration = values.duration;
        } else {
          const durationNum = parseInt(values.duration);
          if (!isNaN(durationNum) && durationNum > 0) {
            taskData.duration = durationNum;
          }
        }
      }

      console.log("Creating task with data:", JSON.stringify(taskData, null, 2));

      const task = await createTask(taskData);
      
      await showToast({
        style: Toast.Style.Success,
        title: "Task Created",
        message: `"${task.name}" has been added to Motion`,
      });
      
      pop();
    } catch (error) {
      console.error("Task creation error:", error);
      
      let errorMessage = "Failed to create task";
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Provide more specific guidance for common errors
        if (error.message.includes("workspaceId")) {
          errorMessage += "\n\nTroubleshooting: Please ensure your Motion API key has access to at least one workspace.";
        } else if (error.message.includes("400")) {
          errorMessage += "\n\nTroubleshooting: Please check that all required fields are filled correctly.";
        } else if (error.message.includes("401") || error.message.includes("403")) {
          errorMessage += "\n\nTroubleshooting: Please check your Motion API key in preferences.";
        }
      }
      
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to Create Task",
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleTestTask() {
    setIsLoading(true);
    
    try {
      console.log("Creating minimal test task");
      
      const testTask = {
        name: "Test Task from Raycast",
        priority: "MEDIUM" as const,
        workspaceId: selectedWorkspaceId,
      };

      console.log("Test task data:", JSON.stringify(testTask, null, 2));

      const task = await createTask(testTask);
      
      await showToast({
        style: Toast.Style.Success,
        title: "Test Task Created",
        message: `"${task.name}" has been added to Motion`,
      });
      
      pop();
    } catch (error) {
      console.error("Test task creation error:", error);
      
      let errorMessage = "Failed to create test task";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      await showToast({
        style: Toast.Style.Failure,
        title: "Test Task Failed",
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDebugTest() {
    setIsLoading(true);
    
    try {
      console.log("🧪 Starting Motion API Debug Test");
      
      // Test 1: Get user info
      console.log("\n1️⃣ Testing user authentication...");
      const user = await getUser();
      console.log("✅ User authenticated:", user.name, user.email);
      
      // Test 2: Get workspaces
      console.log("\n2️⃣ Testing workspace access...");
      const workspaces = await getWorkspaces();
      console.log("✅ Found workspaces:", workspaces.length);
      workspaces.forEach((ws, i) => {
        console.log(`   ${i + 1}. ${ws.name} (${ws.id}) - Type: ${ws.type}`);
      });
      
      // Test 3: Create a minimal test task
      console.log("\n3️⃣ Testing task creation...");
      const testTask = {
        name: "Debug Test Task - " + new Date().toISOString(),
        priority: "LOW" as const,
        workspaceId: selectedWorkspaceId,
      };
      
      const createdTask = await createTask(testTask);
      console.log("✅ Test task created successfully!");
      console.log("   Task ID:", createdTask.id);
      console.log("   Task Name:", createdTask.name);
      console.log("   Workspace:", createdTask.workspace.name);
      
      console.log("\n🎉 All tests passed! Your Motion API integration is working.");
      
      await showToast({
        style: Toast.Style.Success,
        title: "Debug Test Passed",
        message: "Motion API connection is working correctly",
      });
    } catch (error) {
      console.error("Debug test failed:", error);
      
      let errorMessage = "Debug test failed";
      if (error instanceof Error) {
        errorMessage = error.message;
        
        if (error.message.includes("401") || error.message.includes("403")) {
          errorMessage += "\n\n💡 Check your Motion API key in Raycast preferences";
        } else if (error.message.includes("workspaceId")) {
          errorMessage += "\n\n💡 Your API key might not have access to any workspaces";
        } else if (error.message.includes("400")) {
          errorMessage += "\n\n💡 The request format might be incorrect";
        }
      }
      
      await showToast({
        style: Toast.Style.Failure,
        title: "Debug Test Failed",
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form
      isLoading={isLoading || isLoadingData}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Task" onSubmit={handleSubmit} />
          <Action
            title="Create Test Task"
            shortcut={{ modifiers: ["cmd"], key: "t" }}
            onAction={handleTestTask}
          />
          <Action
            title="Run Debug Test"
            shortcut={{ modifiers: ["cmd"], key: "d" }}
            onAction={handleDebugTest}
          />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="name"
        title="Task Name"
        placeholder="Enter task name"
        info="The name of your task (required)"
      />
      
      <Form.TextArea
        id="description"
        title="Description"
        placeholder="Enter task description (optional)"
        info="Detailed description of the task using Markdown"
      />

      <Form.Dropdown
        id="workspaceId"
        title="Workspace"
        value={selectedWorkspaceId}
        onChange={setSelectedWorkspaceId}
        info="Select which workspace to create the task in"
      >
        {workspaces.map((workspace) => (
          <Form.Dropdown.Item
            key={workspace.id}
            value={workspace.id}
            title={workspace.name}
            icon={workspace.type === "TEAM" ? "👥" : "👤"}
          />
        ))}
      </Form.Dropdown>

      <Form.Dropdown
        id="projectId"
        title="Project (Optional)"
        info="Select a project to organize your task"
      >
        <Form.Dropdown.Item value="" title="No Project" />
        {projects.map((project) => (
          <Form.Dropdown.Item
            key={project.id}
            value={project.id}
            title={project.name}
            icon="📁"
          />
        ))}
      </Form.Dropdown>
      
      <Form.Dropdown
        id="priority"
        title="Priority"
        defaultValue="MEDIUM"
        info="Task priority level"
      >
        <Form.Dropdown.Item value="ASAP" title="🔴 ASAP" />
        <Form.Dropdown.Item value="HIGH" title="🟠 High" />
        <Form.Dropdown.Item value="MEDIUM" title="🟡 Medium" />
        <Form.Dropdown.Item value="LOW" title="🔵 Low" />
      </Form.Dropdown>
      
      <Form.DatePicker
        id="dueDate"
        title="Due Date"
        info="When the task should be completed (optional)"
      />
      
      <Form.Dropdown
        id="deadlineType"
        title="Deadline Type"
        defaultValue="SOFT"
        info="How strict the deadline is"
      >
        <Form.Dropdown.Item value="SOFT" title="Soft (Flexible)" />
        <Form.Dropdown.Item value="HARD" title="Hard (Fixed)" />
        <Form.Dropdown.Item value="NONE" title="None" />
      </Form.Dropdown>
      
      <Form.TextField
        id="duration"
        title="Duration (minutes)"
        placeholder="30"
        info="Estimated time to complete the task in minutes, or 'NONE' for no duration, 'REMINDER' for reminder only"
      />
    </Form>
  );
}
