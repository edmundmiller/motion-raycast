import { ActionPanel, Detail, List, Action, Icon, showToast, Toast, Clipboard } from "@raycast/api";
import { useState, useEffect } from "react";
import { getWorkspaces, getProjects, MotionWorkspace, MotionProject } from "./motion-api";

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
            const projectsWithWorkspace = workspaceProjects.map(project => ({
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

  // Filter projects based on search text
  const filteredProjects = projects.filter(project => {
    if (!searchText) return true;
    
    const searchLower = searchText.toLowerCase();
    return (
      project.name.toLowerCase().includes(searchLower) ||
      project.description.toLowerCase().includes(searchLower) ||
      project.workspace.name.toLowerCase().includes(searchLower)
    );
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
    
    if (project.status.isResolvedStatus) return "✅";
    if (project.status.isDefaultStatus) return "🔄";
    return "📋";
  }

  function formatProjectDescription(description: string): string {
    // Remove HTML tags and decode HTML entities for display
    return description
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
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
          </ActionPanel>
        }
      />
    );
  }

  return (
    <List
      isLoading={isLoading}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search projects by name, description, or workspace..."
      throttle
    >
      {filteredProjects.length === 0 && !isLoading && (
        <List.EmptyView
          icon={Icon.MagnifyingGlass}
          title="No Projects Found"
          description={searchText ? "Try adjusting your search terms" : "No projects available"}
        />
      )}
      
      {filteredProjects.map((project) => (
        <List.Item
          key={project.id}
          icon={getProjectStatusIcon(project)}
          title={project.name}
          subtitle={project.workspace.name}
          accessories={[
            { text: project.status?.name || "No status" },
            { text: new Date(project.updatedTime).toLocaleDateString() }
          ]}
          actions={
            <ActionPanel>
              <Action.Push
                title="Show Details"
                target={<ProjectDetail project={project} />}
                icon={Icon.Eye}
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
    </List>
  );
}
