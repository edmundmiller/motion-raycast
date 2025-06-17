import { updateTask, getTasks, MotionTask } from "../motion-api";

/**
 * Parse natural language task updates
 */
function parseUpdateQuery(query: string): {
  priority?: "ASAP" | "HIGH" | "MEDIUM" | "LOW";
  completed?: boolean;
  status?: string;
} {
  const lowerQuery = query.toLowerCase();
  const updates: any = {};

  // Parse priority changes
  if (lowerQuery.includes("urgent") || lowerQuery.includes("asap") || lowerQuery.includes("critical")) {
    updates.priority = "ASAP";
  } else if (lowerQuery.includes("high priority") || lowerQuery.includes("important")) {
    updates.priority = "HIGH";
  } else if (lowerQuery.includes("low priority") || lowerQuery.includes("minor")) {
    updates.priority = "LOW";
  } else if (lowerQuery.includes("medium priority") || lowerQuery.includes("normal")) {
    updates.priority = "MEDIUM";
  }

  // Parse completion status
  if (lowerQuery.includes("complete") || lowerQuery.includes("done") || lowerQuery.includes("finished")) {
    updates.completed = true;
  } else if (lowerQuery.includes("incomplete") || lowerQuery.includes("reopen") || lowerQuery.includes("not done")) {
    updates.completed = false;
  }

  // Parse status updates
  if (lowerQuery.includes("in progress") || lowerQuery.includes("working on")) {
    updates.status = "In Progress";
  } else if (lowerQuery.includes("todo") || lowerQuery.includes("to do")) {
    updates.status = "Todo";
  } else if (lowerQuery.includes("review") || lowerQuery.includes("reviewing")) {
    updates.status = "Review";
  } else if (lowerQuery.includes("blocked") || lowerQuery.includes("waiting")) {
    updates.status = "Blocked";
  }

  return updates;
}

/**
 * Find tasks by name or ID
 */
async function findTasks(identifier: string): Promise<MotionTask[]> {
  // If it looks like a task ID, search by ID first
  if (identifier.match(/^[a-f0-9-]{36}$/i)) {
    try {
      const response = await getTasks();
      const task = response.tasks.find(t => t.id === identifier);
      return task ? [task] : [];
    } catch (error) {
      console.log("Could not search by ID:", error);
    }
  }

  // Search by name
  try {
    const response = await getTasks({ name: identifier });
    return response.tasks;
  } catch (error) {
    console.log("Could not search by name:", error);
    return [];
  }
}

interface UpdateTaskParams {
  taskIdentifier: string;
  updateQuery: string;
}

export default async function updateTaskStatus(params: UpdateTaskParams): Promise<string> {
  try {
    const { taskIdentifier, updateQuery } = params;
    console.log("🔄 AI Tool: Updating task status", { taskIdentifier, updateQuery });

    if (!taskIdentifier || taskIdentifier.trim().length === 0) {
      throw new Error("Task identifier (name or ID) is required");
    }

    if (!updateQuery || updateQuery.trim().length === 0) {
      throw new Error("Update query is required");
    }

    // Find the task(s)
    const tasks = await findTasks(taskIdentifier.trim());
    
    if (tasks.length === 0) {
      return `❌ No tasks found matching: "${taskIdentifier}"`;
    }

    if (tasks.length > 1) {
      return `⚠️ Found ${tasks.length} tasks matching "${taskIdentifier}". Please be more specific:\n\n` +
        tasks.map((task, i) => `${i + 1}. ${task.name} (ID: ${task.id})`).join("\n");
    }

    const task = tasks[0];
    
    // Parse the update query
    const updates = parseUpdateQuery(updateQuery);
    
    if (Object.keys(updates).length === 0) {
      return `❌ Could not understand the update: "${updateQuery}"\n\n` +
        "Try phrases like:\n" +
        "• 'mark as complete' or 'done'\n" +
        "• 'set priority to high'\n" +
        "• 'mark as in progress'\n" +
        "• 'set as urgent'";
    }

    console.log("📝 Parsed updates:", updates);

    // Apply the updates
    const updateData: any = {};
    
    if (updates.priority !== undefined) {
      updateData.priority = updates.priority;
    }
    
    if (updates.completed !== undefined) {
      updateData.completed = updates.completed;
    }

    // For status updates, we need to find the correct status ID
    // This is a simplified version - in a real implementation you'd want to 
    // fetch the workspace statuses and find the matching one
    if (updates.status) {
      console.log(`Note: Status update to "${updates.status}" requested but not implemented (requires workspace status mapping)`);
    }

    // Update the task
    const updatedTask = await updateTask(task.id, updateData);

    // Format the response
    let result = `✅ Successfully updated task: "${updatedTask.name}"\n\n`;
    
    const changes = [];
    
    if (updates.priority) {
      const priorityEmoji = {
        ASAP: "🔴",
        HIGH: "🟠",
        MEDIUM: "🟡", 
        LOW: "🔵",
      }[updates.priority] || "⚪";
      changes.push(`${priorityEmoji} Priority: ${task.priority} → ${updates.priority}`);
    }
    
    if (updates.completed !== undefined) {
      const oldStatus = task.completed ? "✅ Complete" : "⏳ Incomplete";
      const newStatus = updates.completed ? "✅ Complete" : "⏳ Incomplete";
      changes.push(`Status: ${oldStatus} → ${newStatus}`);
    }

    if (changes.length > 0) {
      result += "**Changes made:**\n" + changes.join("\n") + "\n\n";
    }

    result += `🔗 Task ID: ${updatedTask.id}`;

    return result;

  } catch (error) {
    console.error("❌ Failed to update task status:", error);

    let errorMessage = "Failed to update task status";
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;

      if (error.message.includes("401") || error.message.includes("403")) {
        errorMessage += "\n\n💡 Tip: Check your Motion API key in Raycast preferences.";
      } else if (error.message.includes("404")) {
        errorMessage += "\n\n💡 Tip: Make sure the task ID is correct and you have access to it.";
      }
    }

    throw new Error(errorMessage);
  }
} 