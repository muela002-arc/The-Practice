import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-up");
  return <>{children}</>;
}
