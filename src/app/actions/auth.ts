"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const enc = encodeURIComponent;
const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v : "");

export async function login(fd: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: str(fd.get("email")).trim().toLowerCase(),
    password: str(fd.get("password")),
  });
  if (error) {
    const msg =
      error.code === "email_not_confirmed"
        ? "Please confirm your email first. Check your inbox and spam folder, then log in."
        : error.code === "invalid_credentials"
          ? "Wrong email or password."
          : `Could not log in: ${error.message}`;
    redirect(`/login?error=${enc(msg)}`);
  }
  redirect("/dashboard");
}

export async function signup(fd: FormData) {
  const email = str(fd.get("email")).trim().toLowerCase();
  const password = str(fd.get("password"));
  const name = str(fd.get("name")).trim().slice(0, 100);
  if (!email || !name) redirect(`/login?mode=signup&error=${enc("Enter your name and email.")}`);
  if (password.length < 8)
    redirect(`/login?mode=signup&error=${enc("Password must be at least 8 characters.")}`);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });
  if (error) redirect(`/login?mode=signup&error=${enc(error.message)}`);
  // With email confirmation on, Supabase hides existing accounts by returning a user with no identities.
  if (data.user && data.user.identities?.length === 0)
    redirect(`/login?error=${enc("This email is already registered. Log in instead.")}`);
  if (!data.session)
    redirect(`/login?msg=${enc("Check your email to confirm your account, then log in.")}`);
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
