import type { Metadata } from "next";
import Link from "next/link";
import { assignParcel, packParcels, receiveParcel } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { MODES } from "@/lib/constants";
import { fmtDate } from "@/lib/site";
import type { Parcel } from "@/lib/types";

export const metadata: Metadata = { title: "Parcels" };

type Row = Parcel & { profiles: { full_name: string | null; email: string } | null };

export default async function AdminParcels({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("incoming_parcels")
    .select("*,profiles(full_name,email)")
    .neq("status", "packed")
    .order("created_at", { ascending: false })
    .limit(500);
  const rows = (data ?? []) as unknown as Row[];

  const unclaimed = rows.filter((r) => !r.customer_id);
  const expected = rows.filter((r) => r.customer_id && r.status === "expected");
  const ready = new Map<string, { name: string; items: Row[] }>();
  for (const r of rows) {
    if (!r.customer_id || r.status !== "received") continue;
    const g = ready.get(r.customer_id) ?? { name: r.profiles?.full_name || r.profiles?.email || "Customer", items: [] };
    g.items.push(r);
    ready.set(r.customer_id, g);
  }

  return (
    <div className="w page">
      <h1>Parcels</h1>
      {sp.error && <p className="err" role="alert">{sp.error}</p>}
      {sp.msg && <p className="ok" role="status">{sp.msg}</p>}

      <form className="card" action={receiveParcel} style={{ marginBottom: 24 }}>
        <h2 className="h-sm">Receive a parcel</h2>
        <p className="mut small">Enter the tracking number on the parcel. We match it to the customer who registered it.</p>
        <label htmlFor="r1">China tracking number</label>
        <input id="r1" name="tracking" required minLength={5} maxLength={80} autoComplete="off" autoFocus />
        <label htmlFor="r2">Note, if it has no owner yet (optional)</label>
        <input id="r2" name="note" maxLength={300} placeholder="2 brown cartons, shoes" />
        <p style={{ marginTop: 14 }}><button className="btn dark">Mark as received</button></p>
      </form>

      <h2 className="h-sm">Ready to pack ({ready.size} customer{ready.size === 1 ? "" : "s"})</h2>
      {ready.size ? (
        [...ready.entries()].map(([cid, g]) => (
          <form className="card" action={packParcels} key={cid} style={{ marginBottom: 16 }}>
            <input type="hidden" name="customer" value={cid} />
            <h3>{g.name}</h3>
            {g.items.map((p) => (
              <label className="check" key={p.id}>
                <input type="checkbox" name="parcel" value={p.id} defaultChecked />
                <span>
                  {p.description} <span className="mut small">· {p.china_tracking_no}</span>
                </span>
              </label>
            ))}
            <div className="row" style={{ marginTop: 10 }}>
              <div style={{ flex: 1, minWidth: 140 }}>
                <label htmlFor={`m${cid}`}>Mode</label>
                <select id={`m${cid}`} name="mode">{MODES.map((m) => <option key={m}>{m}</option>)}</select>
              </div>
              <div style={{ flex: 2, minWidth: 200 }}>
                <label htmlFor={`d${cid}`}>Delivery</label>
                <input id={`d${cid}`} name="delivery" placeholder="Door delivery, Lagos" maxLength={200} />
              </div>
            </div>
            <p style={{ marginTop: 14 }}><button className="btn dark">Pack and issue tracking number</button></p>
          </form>
        ))
      ) : (
        <p className="mut" style={{ marginBottom: 24 }}>Nothing received and waiting to be packed.</p>
      )}

      <h2 className="h-sm" style={{ marginTop: 28 }}>Unclaimed parcels ({unclaimed.length})</h2>
      {unclaimed.length ? (
        unclaimed.map((p) => (
          <div className="item" key={p.id}>
            <div>
              <b>{p.china_tracking_no}</b>
              <p className="mut small">{p.description} · received {p.received_at ? fmtDate(p.received_at) : ""}</p>
            </div>
            <form action={assignParcel} className="row center">
              <input type="hidden" name="id" value={p.id} />
              <label htmlFor={`a${p.id}`} className="sr-only">Customer email</label>
              <input id={`a${p.id}`} name="email" type="email" required placeholder="customer email" style={{ width: 220 }} />
              <button className="btn">Assign</button>
            </form>
          </div>
        ))
      ) : (
        <p className="mut">No unclaimed parcels.</p>
      )}

      <h2 className="h-sm" style={{ marginTop: 28 }}>Waiting for arrival ({expected.length})</h2>
      {expected.length ? (
        expected.map((p) => (
          <div className="item" key={p.id}>
            <div>
              <b>{p.china_tracking_no}</b>
              <p className="mut small">{p.profiles?.full_name || p.profiles?.email} · {p.description}</p>
            </div>
          </div>
        ))
      ) : (
        <p className="mut">Nothing expected.</p>
      )}
      <p style={{ marginTop: 24 }}><Link href="/admin">Back to shipments</Link></p>
    </div>
  );
}
