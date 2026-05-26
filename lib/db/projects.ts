import { createClient } from "@/lib/db/server";

export type OperationInput = {
  title: string;
  description: string;
};

export type ProjectOperation = {
  id: string;
  ordinal: number;
  title: string;
  description: string;
  createdAt: string;
};

export type ProjectWithOperations = {
  id: string;
  agentId: string;
  title: string;
  goal: string;
  description: string;
  createdAt: string;
  operations: ProjectOperation[];
};

// Inserts a project and its 3-5 operations in a single ACID transaction via
// the create_project_with_operations RPC (see supabase/migrations/0003 + 0005).
// Operations are 1-indexed by array order — caller does NOT supply ordinal.
// Returns the new project id.
//
// Throws if:
//   - operations.length is outside [3, 5]
//   - userId does not match the authenticated caller (RPC guard)
//   - agentId does not belong to the user or is not active (RPC guard)
//   - RLS rejects any insert
export async function createProject(
  userId: string,
  agentId: string,
  title: string,
  goal: string,
  description: string,
  operations: OperationInput[],
): Promise<string> {
  if (operations.length < 3 || operations.length > 5) {
    throw new Error(
      `createProject: operations must be 3-5, got ${operations.length}`,
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    "create_project_with_operations",
    {
      p_user_id: userId,
      p_agent_id: agentId,
      p_title: title,
      p_goal: goal,
      p_description: description,
      p_operations: operations,
    },
  );
  if (error) throw error;
  if (typeof data !== "string") {
    throw new Error(
      "createProject: create_project_with_operations returned no project id",
    );
  }
  return data;
}

// Returns the user's projects with their operations attached, sorted by
// project created_at descending and operations by ordinal ascending.
//
// Uses two queries (projects, then operations IN project_ids) rather than a
// nested-select join. RLS guarantees the caller only sees their own projects
// regardless of the userId passed; the parameter exists for API symmetry with
// createProject and to make the access pattern explicit at the call site.
export async function getProjectsForUser(
  userId: string,
): Promise<ProjectWithOperations[]> {
  const supabase = await createClient();

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, agent_id, title, goal, description, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (projectsError) throw projectsError;
  if (!projects || projects.length === 0) return [];

  const projectIds = projects.map((p) => p.id);
  const { data: operations, error: opsError } = await supabase
    .from("operations")
    .select("id, project_id, ordinal, title, description, created_at")
    .in("project_id", projectIds)
    .order("ordinal", { ascending: true });
  if (opsError) throw opsError;

  const opsByProject = new Map<string, ProjectOperation[]>();
  for (const op of operations ?? []) {
    const list = opsByProject.get(op.project_id) ?? [];
    list.push({
      id: op.id,
      ordinal: op.ordinal,
      title: op.title,
      description: op.description,
      createdAt: op.created_at,
    });
    opsByProject.set(op.project_id, list);
  }

  return projects.map((p) => ({
    id: p.id,
    agentId: p.agent_id,
    title: p.title,
    goal: p.goal,
    description: p.description,
    createdAt: p.created_at,
    operations: opsByProject.get(p.id) ?? [],
  }));
}

// Single project fetch by id, RLS-scoped to the caller. Returns null when the
// project doesn't exist OR doesn't belong to the user (RLS doesn't distinguish).
export async function getProjectById(
  userId: string,
  projectId: string,
): Promise<ProjectWithOperations | null> {
  const supabase = await createClient();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, agent_id, title, goal, description, created_at")
    .eq("id", projectId)
    .eq("user_id", userId)
    .maybeSingle();
  if (projectError) throw projectError;
  if (!project) return null;

  const { data: operations, error: opsError } = await supabase
    .from("operations")
    .select("id, ordinal, title, description, created_at")
    .eq("project_id", projectId)
    .order("ordinal", { ascending: true });
  if (opsError) throw opsError;

  return {
    id: project.id,
    agentId: project.agent_id,
    title: project.title,
    goal: project.goal,
    description: project.description,
    createdAt: project.created_at,
    operations: (operations ?? []).map((op) => ({
      id: op.id,
      ordinal: op.ordinal,
      title: op.title,
      description: op.description,
      createdAt: op.created_at,
    })),
  };
}
