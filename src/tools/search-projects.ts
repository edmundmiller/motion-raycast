import { getProjects, getTasks, MotionProject } from "../motion-api";

/**
 * Format project search results for AI response
 */
async function formatProjectResults(projects: MotionProject[]): Promise<string> {
  if (projects.length === 0) {
    return "No projects found matching your search criteria.";
  }

  let result = `Found ${projects.length} project${projects.length === 1 ? "" : "s"}:\n\n`;

  for (const [index, project] of projects.entries()) {
    result += `${index + 1}. **${project.name}**\n`;
    
    if (project.description && project.description.length > 0) {
      const shortDesc = project.description.length > 150 
        ? project.description.substring(0, 150) + "..." 
        : project.description;
      result += `   📝 Description: ${shortDesc}\n`;
    }

    if (project.status?.name) {
      result += `   📊 Status: ${project.status.name}\n`;
    }

    // Get task count for this project
    try {
      const taskResponse = await getTasks({ projectId: project.id });
      const taskCount = taskResponse.tasks.length;
      const completedTasks = taskResponse.tasks.filter(t => t.completed).length;
      
      result += `   📋 Tasks: ${taskCount} total, ${completedTasks} completed`;
      if (taskCount > 0) {
        const completionPercentage = Math.round((completedTasks / taskCount) * 100);
        result += ` (${completionPercentage}%)`;
      }
      result += "\n";

      // Show priority breakdown if there are tasks
      if (taskCount > 0) {
        const priorityCount = {
          ASAP: 0,
          HIGH: 0,
          MEDIUM: 0,
          LOW: 0
        };
        
        taskResponse.tasks.forEach(task => {
          if (task.priority in priorityCount) {
            priorityCount[task.priority as keyof typeof priorityCount]++;
          }
        });

        const priorityBreakdown = [];
        if (priorityCount.ASAP > 0) priorityBreakdown.push(`🔴 ${priorityCount.ASAP} ASAP`);
        if (priorityCount.HIGH > 0) priorityBreakdown.push(`🟠 ${priorityCount.HIGH} HIGH`);
        if (priorityCount.MEDIUM > 0) priorityBreakdown.push(`🟡 ${priorityCount.MEDIUM} MEDIUM`);
        if (priorityCount.LOW > 0) priorityBreakdown.push(`🔵 ${priorityCount.LOW} LOW`);

        if (priorityBreakdown.length > 0) {
          result += `   🎯 Priority: ${priorityBreakdown.join(", ")}\n`;
        }
      }

    } catch (error) {
      console.log(`Could not get task count for project ${project.id}:`, error);
      result += `   📋 Tasks: Unable to fetch task count\n`;
    }

    result += `   🕐 Created: ${new Date(project.createdTime).toLocaleDateString()}\n`;
    result += `   🔄 Updated: ${new Date(project.updatedTime).toLocaleDateString()}\n`;
    result += `   🔗 ID: ${project.id}\n\n`;
  }

  return result;
}

interface SearchProjectsParams {
  searchQuery?: string;
  workspaceId?: string;
}

export default async function searchProjects(params: SearchProjectsParams = {}): Promise<string> {
  try {
    const { searchQuery, workspaceId } = params;
    console.log("📁 AI Tool: Searching Motion projects", { searchQuery, workspaceId });

    // Get all projects for the workspace
    const projects = await getProjects(workspaceId);

    if (projects.length === 0) {
      return workspaceId 
        ? `No projects found in the specified workspace.`
        : "No projects found. Create your first project in Motion to get started!";
    }

    let filteredProjects = projects;

    // Apply search filter if provided
    if (searchQuery && searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase().trim();
      filteredProjects = projects.filter(project => 
        project.name.toLowerCase().includes(query) ||
        (project.description && project.description.toLowerCase().includes(query))
      );
    }

    // Sort projects by update date (most recent first)
    filteredProjects.sort((a, b) => 
      new Date(b.updatedTime).getTime() - new Date(a.updatedTime).getTime()
    );

    // Format and return results
    const result = await formatProjectResults(filteredProjects);
    
    // Add search context if applicable
    if (searchQuery && searchQuery.trim().length > 0) {
      return result + `\n🔍 Searched for projects containing: "${searchQuery.trim()}"`;
    }

    return result;

  } catch (error) {
    console.error("❌ Failed to search Motion projects:", error);

    let errorMessage = "Failed to search Motion projects";
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;

      if (error.message.includes("401") || error.message.includes("403")) {
        errorMessage += "\n\n💡 Tip: Check your Motion API key in Raycast preferences.";
      } else if (error.message.includes("workspaceId")) {
        errorMessage += "\n\n💡 Tip: Make sure the workspace ID is valid and you have access to it.";
      }
    }

    throw new Error(errorMessage);
  }
} 