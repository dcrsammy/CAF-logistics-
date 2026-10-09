import Link from "next/link";
import { getSession } from "@/lib/auth";
import { signOut } from "@/app/actions/auth";
import { SITE } from "@/lib/site";

export default async function Header() {
  const { user, role } = await getSession();
  return (
    <header className="site-header">
      <div className="w bar">
        <Link href="/" className="logo">
          CAF<span>Logistics</span>
        </Link>
        <nav className="nv" aria-label="Main">
          {user ? (
            <>
              <span className="mut hid">{user.email}</span>
              <Link className="btn" href={role === "admin" ? "/admin" : "/dashboard"}>
                {role === "admin" ? "Admin" : "My shipments"}
              </Link>
              <form action={signOut}>
                <button className="btn">Log out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/#services">Services</Link>
              <Link href="/#quote">Get a quote</Link>
              <Link className="btn pri" href="/login">
                Log in
              </Link>
            </>
          )}
        </nav>
      </div>
      <span className="sr-only">{SITE.name}</span>
    </header>
  );
}
