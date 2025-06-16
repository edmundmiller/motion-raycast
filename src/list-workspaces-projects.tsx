import { List, ActionPanel, Action, showToast, Toast, Clipboard } from "@raycast/api";
import { useState, useEffect } from "react";
import { getWorkspaces, getProjects, MotionWorkspace, MotionProject } from "./motion-api";

interface WorkspaceWithProjects extends MotionWorkspace {
  projects: MotionProject[];
}

export default function ListWorkspacesProjects() {
  const [workspaces, setWorkspaces] = useState<WorkspaceWithProjects[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        console.log("🔄 Loading workspaces and projects...");
        
        // Get workspaces first
        const workspaceList = await getWorkspaces();
        
        // Get projects for each workspace
        const workspacesWithProjects: WorkspaceWithProjects[] = [];
        
        for (const workspace of workspaceList) {
          try {
            const projects = await getProjects(workspace.id);
            workspacesWithProjects.push({
              ...workspace,
              projects,
            });
          } catch (error) {
            console.error(`Failed to load projects for workspace ${workspace.name}:`, error);
            workspacesWithProjects.push({
              ...workspace,
              projects: [],
            });
          }
        }
        
        setWorkspaces(workspacesWithProjects);
        console.log("✅ Loaded all workspaces and projects");
      } catch (error) {
        console.error("❌ Failed to load data:", error);
        await showToast({
          style: Toast.Style.Failure,
          title: "Failed to Load Data",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);

  async function copyWorkspaceId(workspace: MotionWorkspace) {
    await Clipboard.copy(workspace.id);
    await showToast({
      style: Toast.Style.Success,
      title: "Copied Workspace ID",
      message: `"${workspace.name}" ID copied to clipboard`,
    });
  }

  async function copyProjectId(project: MotionProject) {
    await Clipboard.copy(project.id);
    await showToast({
      style: Toast.Style.Success,
      title: "Copied Project ID",
      message: `"${project.name}" ID copied to clipboard`,
    });
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search workspaces and projects...">
      {workspaces.map((workspace) => (
        <List.Section key={workspace.id} title={`${workspace.name} (${workspace.type})`}>
          <List.Item
            title={workspace.name}
            subtitle={`Workspace ID: ${workspace.id}`}
            icon={workspace.type === "TEAM" ? "👥" : "👤"}
            accessories={[
              { text: `${workspace.projects.length} projects` },
              { text: workspace.type },
            ]}
            actions={
              <ActionPanel>
                <Action
                  title="Copy Workspace ID"
                  onAction={() => copyWorkspaceId(workspace)}
                  icon="📋"
                />
              </ActionPanel>
            }
          />
          {workspace.projects.map((project) => (
            <List.Item
              key={project.id}
              title={`  📁 ${project.name}`}
              subtitle={`Project ID: ${project.id}`}
              accessories={[
                { text: project.description ? "Has description" : "No description" },
              ]}
              actions={
                <ActionPanel>
                  <Action
                    title="Copy Project ID"
                    onAction={() => copyProjectId(project)}
                    icon="📋"
                  />
                  <Action
                    title="Copy Workspace ID"
                    onAction={() => copyWorkspaceId(workspace)}
                    icon="👥"
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ))}
    </List>
  );
} 