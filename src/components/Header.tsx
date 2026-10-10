import Link from "next/link";
import { getSession } from "@/lib/auth";
import { signOut } from "@/app/actions/auth";

export default async function Header() {
  const { user, role } = await getSession();
  return (
    <header className="site-header">
      <div className="w bar">
        <Link href="/" className="logo">
          CAF<span>Logistics</span>
        </Link>
        <nav className="nv" aria-label="Main">
          <Link href="/track">Track</Link>
          {user ? (
            role === "admin" ? (
              <>
                <Link href="/admin/parcels">Parcels</Link>
                <Link href="/admin">Shipments</Link>
              </>
            ) : (
              <>
                <Link href="/orders">My orders</Link>
                <Link href="/dashboard">My shipments</Link>
              </>
            )
          ) : (
            <>
              <Link href="/#services">Services</Link>
              <Link href="/#quote">Get a quote</Link>
            </>
          )}
          {user ? (
            <form action={signOut}>
              <button className="btn">Log out</button>
            </form>
          ) : (
            <Link className="btn dark" href="/login">
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
