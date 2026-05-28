import { createClient } from "@/lib/db/server";

export type Drill = {
  id: string;
  title: string;
  prompt: string;
  createdAt: string;
};

// Returns every drill in creation order (oldest first). Drills are global
// content; RLS permits all authenticated users to SELECT.
export async function getDrills(): Promise<Drill[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("drills")
    .select("id, title, prompt, created_at")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    prompt: row.prompt,
    createdAt: row.created_at,
  }));
}

// Returns a single drill by id, or null if not found.
export async function getDrillById(drillId: string): Promise<Drill | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("drills")
    .select("id, title, prompt, created_at")
    .eq("id", drillId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    title: data.title,
    prompt: data.prompt,
    createdAt: data.created_at,
  };
}
