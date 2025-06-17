import { getTasks, MotionTask } from "../motion-api";

interface SearchTasksParams {
  searchQuery: string;
  limit?: number;
  workspaceId?: string;
}

/**
 * Parse natural language search queries into API parameters
 */
function parseSearchQuery(query: string): {
  name?: string;
  priority?: "ASAP" | "HIGH" | "MEDIUM" | "LOW";
  completed?: boolean;
  assigneeSearch?: string;
  projectSearch?: string;
} {
  const lowerQuery = query.toLowerCase();
  const params: any = {};

  // Extract priority searches
  if (lowerQuery.includes("urgent") || lowerQuery.includes("asap") || lowerQuery.includes("critical")) {
    params.priority = "ASAP";
  } else if (lowerQuery.includes("high priority") || lowerQuery.includes("important")) {
    params.priority = "HIGH";
  } else if (lowerQuery.includes("low priority") || lowerQuery.includes("minor")) {
    params.priority = "LOW";
  } else if (lowerQuery.includes("medium priority") || lowerQuery.includes("normal")) {
    params.priority = "MEDIUM";
  }

  // Extract completion status
  if (lowerQuery.includes("completed") || lowerQuery.includes("done") || lowerQuery.includes("finished")) {
    params.completed = true;
  } else if (lowerQuery.includes("pending") || lowerQuery.includes("incomplete") || lowerQuery.includes("todo")) {
    params.completed = false;
  }

  // Extract assignee searches
  const assigneeMatch = lowerQuery.match(/assigned to (\w+)/);
  if (assigneeMatch) {
    params.assigneeSearch = assigneeMatch[1];
  }

  // Extract project searches
  const projectMatch = lowerQuery.match(/in project (\w+)/);
  if (projectMatch) {
    params.projectSearch = projectMatch[1];
  }

  // Use the remaining text as a name search
  let nameQuery = query;
  if (params.priority) {
    nameQuery = nameQuery.replace(/(urgent|asap|critical|high priority|important|low priority|minor|medium priority|normal)/gi, "");
  }
  if (params.completed !== undefined) {
    nameQuery = nameQuery.replace(/(completed|done|finished|pending|incomplete|todo)/gi, "");
  }
  if (assigneeMatch) {
    nameQuery = nameQuery.replace(/assigned to \w+/gi, "");
  }
  if (projectMatch) {
    nameQuery = nameQuery.replace(/in project \w+/gi, "");
  }

  nameQuery = nameQuery.trim();
  if (nameQuery.length > 0) {
    params.name = nameQuery;
  }

  return params;
}

/**
 * Format task results for AI response
 */
function formatTaskResults(tasks: MotionTask[], searchParams: any): string {
  if (tasks.length === 0) {
    return "No tasks found matching your search criteria.";
  }

  let result = `Found ${tasks.length} task${tasks.length === 1 ? "" : "s"}:\n\n`;

  tasks.forEach((task, index) => {
    const priorityEmoji = {
      ASAP: "🔴",
      HIGH: "🟠", 
      MEDIUM: "🟡",
      LOW: "🔵",
    }[task.priority] || "⚪";

    const statusEmoji = task.completed ? "✅" : "⏳";
    
    result += `${index + 1}. ${statusEmoji} **${task.name}**\n`;
    result += `   ${priorityEmoji} Priority: ${task.priority}\n`;
    
    if (task.project?.Name) {
      result += `   📁 Project: ${task.project.Name}\n`;
    }
    
    if (task.status?.name) {
      result += `   📊 Status: ${task.status.name}\n`;
    }
    
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      const now = new Date();
      const isOverdue = dueDate < now && !task.completed;
      result += `   📅 Due: ${dueDate.toLocaleDateString()}${isOverdue ? " (⚠️ OVERDUE)" : ""}\n`;
    }
    
    if (task.assignees.length > 0) {
      result += `   👤 Assigned to: ${task.assignees.map(a => a.name).join(", ")}\n`;
    }
    
    if (task.description && task.description.length > 0) {
      const shortDesc = task.description.length > 100 
        ? task.description.substring(0, 100) + "..." 
        : task.description;
      result += `   📝 Description: ${shortDesc}\n`;
    }
    
    if (task.schedulingIssue) {
      result += `   ⚠️ Has scheduling issues\n`;
    }
    
    result += `   🔗 ID: ${task.id}\n\n`;
  });

  // Add search summary
  if (searchParams.name) {
    result += `🔍 Searched for tasks containing: "${searchParams.name}"\n`;
  }
  if (searchParams.priority) {
    result += `🎯 Filtered by priority: ${searchParams.priority}\n`;
  }
  if (searchParams.completed !== undefined) {
    result += `📊 Filtered by status: ${searchParams.completed ? "Completed" : "Pending"}\n`;
  }

  return result;
}

export default async function searchMotionTasks(params: SearchTasksParams): Promise<string> {
  try {
    const { searchQuery, limit, workspaceId } = params;
    
    console.log("🔍 AI Tool: Searching Motion tasks", { searchQuery, limit, workspaceId });

    if (!searchQuery || searchQuery.trim().length === 0) {
      throw new Error("Search query is required");
    }

    // Parse the natural language query
    const searchParams = parseSearchQuery(searchQuery);
    console.log("📝 Parsed search parameters:", searchParams);

    // Build API parameters
    const apiParams: any = {};
    
    if (searchParams.name) {
      apiParams.name = searchParams.name;
    }
    
    if (workspaceId) {
      apiParams.workspaceId = workspaceId;
    }

    // Get tasks from API
    const response = await getTasks(apiParams);
    let tasks = response.tasks;

    // Apply client-side filtering for parameters not supported by API
    if (searchParams.priority) {
      tasks = tasks.filter(task => task.priority === searchParams.priority);
    }

    if (searchParams.completed !== undefined) {
      tasks = tasks.filter(task => task.completed === searchParams.completed);
    }

    if (searchParams.assigneeSearch) {
      tasks = tasks.filter(task => 
        task.assignees.some(assignee => 
          assignee.name.toLowerCase().includes(searchParams.assigneeSearch!.toLowerCase())
        )
      );
    }

    if (searchParams.projectSearch) {
      tasks = tasks.filter(task => 
        task.project?.Name.toLowerCase().includes(searchParams.projectSearch!.toLowerCase())
      );
    }

    // Apply limit if specified
    if (limit && limit > 0) {
      tasks = tasks.slice(0, limit);
    }

    // Sort by priority and due date
    tasks.sort((a, b) => {
      const priorityOrder = { ASAP: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      const aPriority = priorityOrder[a.priority] ?? 4;
      const bPriority = priorityOrder[b.priority] ?? 4;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // Secondary sort by due date
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      
      return 0;
    });

    return formatTaskResults(tasks, searchParams);

  } catch (error) {
    console.error("❌ Failed to search Motion tasks:", error);

    let errorMessage = "Failed to search Motion tasks";
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;

      if (error.message.includes("401") || error.message.includes("403")) {
        errorMessage += "\n\n💡 Tip: Check your Motion API key in Raycast preferences.";
      }
    }

    throw new Error(errorMessage);
  }
} 