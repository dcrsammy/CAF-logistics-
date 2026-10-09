"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const enc = encodeURIComponent;
const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v : "");

export async function login(fd: FormData) {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: str(fd.get("email")).trim().toLowerCase(),
    password: str(fd.get("password")),
  });
  if (error) redirect(`/login?error=${enc("Wrong email or password.")}`);
  redirect("/dashboard");
}

export async function signup(fd: FormData) {
  const email = str(fd.get("email")).trim().toLowerCase();
  const password = str(fd.get("password"));
  const name = str(fd.get("name")).trim().slice(0, 100);
  if (!email || !name) redirect(`/login?mode=signup&error=${enc("Enter your name and email.")}`);
  if (password.length < 8)
    redirect(`/login?mode=signup&error=${enc("Password must be at least 8 characters.")}`);

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });
  if (error) redirect(`/login?mode=signup&error=${enc(error.message)}`);
  if (!data.session)
    redirect(`/login?msg=${enc("Check your email to confirm your account, then log in.")}`);
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}
