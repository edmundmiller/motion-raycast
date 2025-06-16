import { getPreferenceValues } from "@raycast/api";

interface Preferences {
  apiKey: string;
}

export interface MotionTask {
  id: string;
  name: string;
  description: string;
  duration: string | number;
  dueDate?: string;
  deadlineType: "HARD" | "SOFT" | "NONE";
  parentRecurringTaskId: string;
  completed: boolean;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  project?: {
    id: string;
    Name: string;
    Description: string;
    WorkspaceId: string;
  };
  status?: {
    name: string;
    isDefaultStatus: boolean;
    isResolvedStatus: boolean;
  };
  workspace: {
    id: string;
    name: string;
    teamId: string;
    type: string;
  };
  labels: Array<{
    name: string;
  }>;
  statuses: Array<{
    name: string;
    isDefaultStatus: boolean;
    isResolvedStatus: boolean;
  }>;
  priority: "ASAP" | "HIGH" | "MEDIUM" | "LOW";
  assignees: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  scheduledStart?: string;
  createdTime: string;
  scheduledEnd?: string;
  schedulingIssue: boolean;
}

export interface MotionTasksResponse {
  meta: {
    nextCursor?: string;
    pageSize: number;
  };
  tasks: MotionTask[];
}

const BASE_URL = "https://api.usemotion.com/v1";

async function makeMotionRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const { apiKey } = getPreferenceValues<Preferences>();
  
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Motion API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function getTasks(params?: {
  assigneeId?: string;
  cursor?: string;
  includeAllStatuses?: boolean;
  label?: string;
  name?: string;
  projectId?: string;
  status?: string[];
  workspaceId?: string;
}): Promise<MotionTasksResponse> {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });
  }

  const endpoint = `/tasks${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  return makeMotionRequest<MotionTasksResponse>(endpoint);
}

export async function createTask(task: {
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
}): Promise<MotionTask> {
  return makeMotionRequest<MotionTask>("/tasks", {
    method: "POST",
    body: JSON.stringify(task),
  });
}

export async function updateTask(taskId: string, updates: Partial<MotionTask>): Promise<MotionTask> {
  return makeMotionRequest<MotionTask>(`/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
} 