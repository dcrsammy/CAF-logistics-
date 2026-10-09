import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Pill from "@/components/Pill";
import { requireUser } from "@/lib/auth";
import { TABS } from "@/lib/constants";
import { fmtDate } from "@/lib/site";
import type { Shipment } from "@/lib/types";

export const metadata: Metadata = { title: "My shipments" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const sp = await searchParams;
  const { supabase, role } = await requireUser();
  if (role === "admin") redirect("/admin");

  const tab = sp.tab && sp.tab in TABS ? sp.tab : "All";
  const { data } = await supabase.from("shipments").select("*").order("created_at", { ascending: false });
  const list = ((data ?? []) as Shipment[]).filter((s) => TABS[tab](s.status));

  return (
    <div className="w page">
      <h1>My shipments</h1>
      <div className="tabs" role="tablist" aria-label="Filter shipments">
        {Object.keys(TABS).map((t) => (
          <Link
            key={t}
            href={t === "All" ? "/dashboard" : `/dashboard?tab=${encodeURIComponent(t)}`}
            className={`btn${t === tab ? " on" : ""}`}
            aria-current={t === tab ? "page" : undefined}
          >
            {t}
          </Link>
        ))}
      </div>
      {list.length ? (
        list.map((s) => (
          <div className="item" key={s.id}>
            <div>
              <b>{s.tracking_no}</b> <span className="mut">{s.mode}</span>
              <p>{s.goods}</p>
              <p className="mut small">Updated {fmtDate(s.updated_at)}</p>
            </div>
            <div className="row center">
              <Pill status={s.status} />
              <Link className="btn" href={`/shipments/${s.id}`}>View</Link>
            </div>
          </div>
        ))
      ) : (
        <div className="card">
          <h3>No shipments here yet</h3>
          <p className="mut">Send your goods to our Guangzhou warehouse and they will appear here.</p>
        </div>
      )}
    </div>
  );
}
