import { getPreferenceValues } from "@raycast/api";
import { createTask, getDefaultWorkspaceId, getProjects } from "../motion-api";

interface Preferences {
  defaultWorkspaceId?: string;
  defaultProjectId?: string;
  defaultPriority?: "ASAP" | "HIGH" | "MEDIUM" | "LOW";
  defaultDuration?: string;
}

interface CreateTaskParams {
  taskName: string;
  taskDescription?: string;
  priority?: string;
  durationMinutes?: number;
  dueDate?: string;
  projectName?: string;
}

/**
 * Parse natural language date strings into ISO format
 * Handles: "today", "tomorrow", "next monday", "in 3 days", "2024-01-15", etc.
 */
function parseNaturalDate(dateString: string): string | null {
  const lowerDate = dateString.toLowerCase().trim();
  const now = new Date();
  
  // Handle "today"
  if (lowerDate === "today") {
    return now.toISOString();
  }
  
  // Handle "tomorrow"
  if (lowerDate === "tomorrow") {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString();
  }
  
  // Handle "in X days"
  const inDaysMatch = lowerDate.match(/in (\d+) days?/);
  if (inDaysMatch) {
    const days = parseInt(inDaysMatch[1]);
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + days);
    return futureDate.toISOString();
  }
  
  // Handle "next [day of week]"
  const dayOfWeekMatch = lowerDate.match(/next (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
  if (dayOfWeekMatch) {
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const targetDay = dayNames.indexOf(dayOfWeekMatch[1]);
    const currentDay = now.getDay();
    const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7;
    const nextDay = new Date(now);
    nextDay.setDate(nextDay.getDate() + daysUntilTarget);
    return nextDay.toISOString();
  }
  
  // Handle standard date formats
  try {
    const parsedDate = new Date(dateString);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString();
    }
  } catch (error) {
    console.log(`Could not parse date: ${dateString}`);
  }
  
  return null;
}

/**
 * Parse natural language priority strings
 * Handles: "urgent", "high priority", "low", "medium priority", etc.
 */
function parseNaturalPriority(priorityString: string): "ASAP" | "HIGH" | "MEDIUM" | "LOW" | null {
  const lowerPriority = priorityString.toLowerCase().trim();
  
  if (lowerPriority.includes("urgent") || lowerPriority.includes("asap") || lowerPriority.includes("critical")) {
    return "ASAP";
  }
  
  if (lowerPriority.includes("high") || lowerPriority.includes("important")) {
    return "HIGH";
  }
  
  if (lowerPriority.includes("low") || lowerPriority.includes("minor")) {
    return "LOW";
  }
  
  if (lowerPriority.includes("medium") || lowerPriority.includes("normal")) {
    return "MEDIUM";
  }
  
  return null;
}

export default async function createMotionTask(params: CreateTaskParams): Promise<string> {
  try {
    const { taskName, taskDescription, priority, durationMinutes, dueDate, projectName } = params;
    
    console.log("🤖 AI Tool: Creating Motion task", {
      taskName,
      taskDescription,
      priority,
      durationMinutes,
      dueDate,
      projectName,
    });

    // Validate required parameters
    if (!taskName || taskName.trim().length === 0) {
      throw new Error("Task name is required");
    }

    // Get user preferences
    const preferences = getPreferenceValues<Preferences>();

    // Prepare task data
    const taskData: {
      name: string;
      description?: string;
      duration?: string | number;
      dueDate?: string;
      deadlineType?: "HARD" | "SOFT" | "NONE";
      priority?: "ASAP" | "HIGH" | "MEDIUM" | "LOW";
      assigneeId?: string;
      projectId?: string;
      workspaceId?: string;
      labels?: string[];
    } = {
      name: taskName.trim(),
    };

    // Add description if provided
    if (taskDescription && taskDescription.trim()) {
      taskData.description = taskDescription.trim();
    }

    // Set priority with natural language parsing
    let finalPriority: "ASAP" | "HIGH" | "MEDIUM" | "LOW" | undefined;
    if (priority) {
      finalPriority = parseNaturalPriority(priority) || preferences.defaultPriority || "MEDIUM";
    } else {
      finalPriority = preferences.defaultPriority || "MEDIUM";
    }
    taskData.priority = finalPriority;

    // Set duration if provided or use preference default
    if (durationMinutes !== undefined && durationMinutes > 0) {
      taskData.duration = durationMinutes;
    } else if (preferences.defaultDuration) {
      const defaultDuration = preferences.defaultDuration;
      if (defaultDuration === "NONE" || defaultDuration === "REMINDER") {
        taskData.duration = defaultDuration;
      } else {
        const durationNum = parseInt(defaultDuration);
        if (!isNaN(durationNum) && durationNum > 0) {
          taskData.duration = durationNum;
        }
      }
    }

    // Set due date with natural language parsing
    if (dueDate) {
      const parsedDate = parseNaturalDate(dueDate);
      if (parsedDate) {
        taskData.dueDate = parsedDate;
        // Set deadline type based on priority
        taskData.deadlineType = finalPriority === "ASAP" ? "HARD" : "SOFT";
      } else {
        console.log(`⚠️ Could not parse due date: ${dueDate}`);
      }
    }

    // Set workspace ID
    if (preferences.defaultWorkspaceId) {
      taskData.workspaceId = preferences.defaultWorkspaceId;
    } else {
      // Get the default workspace if none specified
      taskData.workspaceId = await getDefaultWorkspaceId();
    }

    // Handle project assignment with improved matching
    if (projectName) {
      try {
        const projects = await getProjects(taskData.workspaceId);
        const projectNameLower = projectName.toLowerCase();
        
        // Try exact match first
        let matchingProject = projects.find(
          (project) => project.name.toLowerCase() === projectNameLower
        );
        
        // If no exact match, try partial matching
        if (!matchingProject) {
          matchingProject = projects.find(
            (project) =>
              project.name.toLowerCase().includes(projectNameLower) ||
              projectNameLower.includes(project.name.toLowerCase())
          );
        }

        if (matchingProject) {
          taskData.projectId = matchingProject.id;
          console.log(`📁 Found matching project: ${matchingProject.name} (${matchingProject.id})`);
        } else {
          console.log(`⚠️ No matching project found for: ${projectName}`);
          console.log(`Available projects: ${projects.map(p => p.name).join(", ")}`);
        }
      } catch (error) {
        console.log(`⚠️ Failed to search for project: ${error}`);
      }
    } else if (preferences.defaultProjectId) {
      taskData.projectId = preferences.defaultProjectId;
    }

    // Create the task
    const createdTask = await createTask(taskData);

    console.log("✅ Task created successfully:", createdTask.id);

    // Return a success message with task details
    let result = `✅ Successfully created task: "${createdTask.name}"`;

    if (createdTask.project) {
      result += `\n📁 Project: ${createdTask.project.Name}`;
    }

    if (createdTask.priority) {
      const priorityEmoji =
        {
          ASAP: "🔴",
          HIGH: "🟠",
          MEDIUM: "🟡",
          LOW: "🔵",
        }[createdTask.priority] || "⚪";
      result += `\n${priorityEmoji} Priority: ${createdTask.priority}`;
    }

    if (createdTask.duration && createdTask.duration !== "NONE") {
      result += `\n⏱️ Duration: ${createdTask.duration} minutes`;
    }

    if (createdTask.dueDate) {
      result += `\n📅 Due: ${new Date(createdTask.dueDate).toLocaleDateString()}`;
    }

    if (createdTask.workspace) {
      result += `\n🏢 Workspace: ${createdTask.workspace.name}`;
    }

    result += `\n🔗 Task ID: ${createdTask.id}`;

    return result;
  } catch (error) {
    console.error("❌ Failed to create Motion task:", error);

    let errorMessage = "Failed to create Motion task";
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;

      // Provide helpful troubleshooting tips
      if (error.message.includes("workspaceId")) {
        errorMessage += "\n\n💡 Tip: Make sure your Motion API key has access to at least one workspace.";
      } else if (error.message.includes("401") || error.message.includes("403")) {
        errorMessage += "\n\n💡 Tip: Check your Motion API key in Raycast preferences.";
      } else if (error.message.includes("400")) {
        errorMessage += "\n\n💡 Tip: Check that the task name is valid and all parameters are correct.";
      }
    }

    throw new Error(errorMessage);
  }
}
