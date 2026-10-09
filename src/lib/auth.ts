import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

export async function getSession() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, role: null as Role | null };
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return { supabase, user, role: (data?.role ?? "customer") as Role };
}

export async function requireUser() {
  const s = await getSession();
  const user = s.user;
  if (!user) redirect("/login");
  return { supabase: s.supabase, user, role: (s.role ?? "customer") as Role };
}

export async function requireAdmin() {
  const s = await requireUser();
  if (s.role !== "admin") redirect("/dashboard");
  return s;
}
