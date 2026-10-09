import type { Metadata } from "next";
import Link from "next/link";
import { login, signup } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; error?: string; msg?: string }>;
}) {
  const sp = await searchParams;
  const signupMode = sp.mode === "signup";
  return (
    <div className="w narrow">
      <h1>{signupMode ? "Create your account" : "Log in"}</h1>
      {sp.error && <p className="err" role="alert">{sp.error}</p>}
      {sp.msg && <p className="ok" role="status">{sp.msg}</p>}
      <form className="card" action={signupMode ? signup : login}>
        {signupMode && (
          <>
            <label htmlFor="name">Full name</label>
            <input id="name" name="name" required maxLength={100} autoComplete="name" />
          </>
        )}
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={signupMode ? 8 : undefined}
          autoComplete={signupMode ? "new-password" : "current-password"}
        />
        <p style={{ marginTop: 16 }}>
          <button className="btn pri">{signupMode ? "Create account" : "Log in"}</button>
        </p>
      </form>
      <p className="mut" style={{ marginTop: 16 }}>
        {signupMode ? (
          <>Already have an account? <Link href="/login">Log in</Link></>
        ) : (
          <>New customer? <Link href="/login?mode=signup">Create an account</Link></>
        )}
      </p>
    </div>
  );
}
