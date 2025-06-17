import { getTasks, MotionTask } from "../motion-api";

/**
 * Analyze tasks and provide insights
 */
function analyzeTasks(tasks: MotionTask[]): {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  todaysTasks: MotionTask[];
  urgentTasks: MotionTask[];
  priorityBreakdown: Record<string, number>;
  projectBreakdown: Record<string, number>;
  schedulingIssues: number;
} {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const analysis = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.completed).length,
    pendingTasks: tasks.filter(t => !t.completed).length,
    overdueTasks: tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && !t.completed).length,
    todaysTasks: tasks.filter(t => {
      if (!t.createdTime) return false;
      const createdDate = new Date(t.createdTime);
      return createdDate >= today;
    }),
    urgentTasks: tasks.filter(t => t.priority === "ASAP" && !t.completed),
    priorityBreakdown: {} as Record<string, number>,
    projectBreakdown: {} as Record<string, number>,
    schedulingIssues: tasks.filter(t => t.schedulingIssue).length,
  };

  // Calculate priority breakdown
  tasks.forEach(task => {
    analysis.priorityBreakdown[task.priority] = (analysis.priorityBreakdown[task.priority] || 0) + 1;
  });

  // Calculate project breakdown
  tasks.forEach(task => {
    const projectName = task.project?.Name || "No Project";
    analysis.projectBreakdown[projectName] = (analysis.projectBreakdown[projectName] || 0) + 1;
  });

  return analysis;
}

/**
 * Format the task summary for AI response
 */
function formatTaskSummary(analysis: any): string {
  let summary = "# 📊 Motion Task Summary\n\n";

  // Overall stats
  summary += "## 📈 Overall Statistics\n";
  summary += `• **Total Tasks:** ${analysis.totalTasks}\n`;
  summary += `• **Completed:** ${analysis.completedTasks} (${analysis.totalTasks > 0 ? Math.round(analysis.completedTasks / analysis.totalTasks * 100) : 0}%)\n`;
  summary += `• **Pending:** ${analysis.pendingTasks}\n`;
  
  if (analysis.overdueTasks > 0) {
    summary += `• **⚠️ Overdue:** ${analysis.overdueTasks}\n`;
  }
  
  if (analysis.schedulingIssues > 0) {
    summary += `• **🚨 Scheduling Issues:** ${analysis.schedulingIssues}\n`;
  }

  summary += "\n";

  // Today's tasks
  if (analysis.todaysTasks.length > 0) {
    summary += "## 🆕 Today's New Tasks\n";
    summary += `Created ${analysis.todaysTasks.length} task${analysis.todaysTasks.length === 1 ? "" : "s"} today:\n\n`;
    
    analysis.todaysTasks.slice(0, 5).forEach((task: MotionTask, index: number) => {
      const priorityEmoji = {
        ASAP: "🔴",
        HIGH: "🟠",
        MEDIUM: "🟡",
        LOW: "🔵",
      }[task.priority] || "⚪";
      
      summary += `${index + 1}. ${priorityEmoji} **${task.name}**\n`;
      if (task.project?.Name) {
        summary += `   📁 ${task.project.Name}\n`;
      }
    });
    
    if (analysis.todaysTasks.length > 5) {
      summary += `\n... and ${analysis.todaysTasks.length - 5} more\n`;
    }
    
    summary += "\n";
  }

  // Urgent tasks
  if (analysis.urgentTasks.length > 0) {
    summary += "## 🚨 Urgent Tasks Requiring Attention\n";
    summary += `You have ${analysis.urgentTasks.length} urgent task${analysis.urgentTasks.length === 1 ? "" : "s"}:\n\n`;
    
    analysis.urgentTasks.slice(0, 5).forEach((task: MotionTask, index: number) => {
      summary += `${index + 1}. 🔴 **${task.name}**\n`;
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const isOverdue = dueDate < new Date();
        summary += `   📅 Due: ${dueDate.toLocaleDateString()}${isOverdue ? " (OVERDUE)" : ""}\n`;
      }
      if (task.project?.Name) {
        summary += `   📁 ${task.project.Name}\n`;
      }
    });
    
    if (analysis.urgentTasks.length > 5) {
      summary += `\n... and ${analysis.urgentTasks.length - 5} more\n`;
    }
    
    summary += "\n";
  }

  // Priority breakdown
  summary += "## 🎯 Priority Breakdown\n";
  const priorityOrder = ["ASAP", "HIGH", "MEDIUM", "LOW"];
  const priorityEmojis = {
    ASAP: "🔴",
    HIGH: "🟠",
    MEDIUM: "🟡",
    LOW: "🔵",
  };
  
  priorityOrder.forEach(priority => {
    const count = analysis.priorityBreakdown[priority] || 0;
    if (count > 0) {
      summary += `• ${priorityEmojis[priority as keyof typeof priorityEmojis]} **${priority}:** ${count}\n`;
    }
  });
  
  summary += "\n";

  // Project breakdown (top 5)
  if (Object.keys(analysis.projectBreakdown).length > 0) {
    summary += "## 📁 Top Projects by Task Count\n";
    const sortedProjects = Object.entries(analysis.projectBreakdown)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5);
    
    sortedProjects.forEach(([project, count]) => {
      summary += `• **${project}:** ${count} task${count === 1 ? "" : "s"}\n`;
    });
    
    summary += "\n";
  }

  // Recommendations
  summary += "## 💡 Recommendations\n";
  
  if (analysis.overdueTasks > 0) {
    summary += `• ⚠️ You have ${analysis.overdueTasks} overdue task${analysis.overdueTasks === 1 ? "" : "s"}. Consider prioritizing these.\n`;
  }
  
  if (analysis.urgentTasks.length > 3) {
    summary += `• 🚨 You have ${analysis.urgentTasks.length} urgent tasks. Consider if some can be reprioritized.\n`;
  }
  
  if (analysis.schedulingIssues > 0) {
    summary += `• 🗓️ ${analysis.schedulingIssues} task${analysis.schedulingIssues === 1 ? " has" : "s have"} scheduling issues. Check Motion for conflicts.\n`;
  }
  
  const completionRate = analysis.totalTasks > 0 ? analysis.completedTasks / analysis.totalTasks : 0;
  if (completionRate > 0.8) {
    summary += `• 🎉 Great work! You've completed ${Math.round(completionRate * 100)}% of your tasks.\n`;
  } else if (completionRate < 0.3) {
    summary += `• 📈 Focus on completing more tasks. Current completion rate: ${Math.round(completionRate * 100)}%\n`;
  }

  return summary;
}

interface TaskSummaryParams {
  workspaceId?: string;
  includeCompleted?: boolean;
}

export default async function getTaskSummary(params: TaskSummaryParams = {}): Promise<string> {
  try {
    const { workspaceId, includeCompleted = true } = params;
    console.log("📊 AI Tool: Getting task summary", { workspaceId, includeCompleted });

    // Fetch tasks
    const apiParams: any = {};
    if (workspaceId) {
      apiParams.workspaceId = workspaceId;
    }
    
    // If we don't want completed tasks, we need to filter them out
    if (!includeCompleted) {
      apiParams.includeAllStatuses = false;
    }

    const response = await getTasks(apiParams);
    let tasks = response.tasks;

    // Filter out completed tasks if requested
    if (!includeCompleted) {
      tasks = tasks.filter(task => !task.completed);
    }

    if (tasks.length === 0) {
      return "📭 No tasks found. Time to create some new ones!";
    }

    // Analyze the tasks
    const analysis = analyzeTasks(tasks);

    // Format and return the summary
    return formatTaskSummary(analysis);

  } catch (error) {
    console.error("❌ Failed to get task summary:", error);

    let errorMessage = "Failed to get task summary";
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;

      if (error.message.includes("401") || error.message.includes("403")) {
        errorMessage += "\n\n💡 Tip: Check your Motion API key in Raycast preferences.";
      }
    }

    throw new Error(errorMessage);
  }
} 