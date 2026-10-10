import type { Metadata } from "next";
import Link from "next/link";
import Pill from "@/components/Pill";
import { createShipment, updateShipment } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { MODES, STATUSES } from "@/lib/constants";
import { fmtDate } from "@/lib/site";
import type { QuoteRequest, Shipment } from "@/lib/types";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; edit?: string; msg?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const q = (sp.q ?? "").replace(/[,()%*\\]/g, "").trim().slice(0, 60);

  let query = supabase.from("shipments").select("*").order("created_at", { ascending: false }).limit(100);
  if (q) query = query.or(`tracking_no.ilike.%${q}%,customer_email.ilike.%${q}%,goods.ilike.%${q}%`);
  const [{ data }, { data: quotes }] = await Promise.all([
    query,
    supabase.from("quote_requests").select("*").order("created_at", { ascending: false }).limit(10),
  ]);

  const list = (data ?? []) as Shipment[];
  const current = list.find((s) => s.id === sp.edit) ?? list[0];

  return (
    <div className="w page">
      <div className="row center" style={{ justifyContent: "space-between", marginBottom: 18 }}>
        <h1 style={{ margin: 0 }}>Shipments</h1>
        <Link className="btn dark" href="/admin/parcels">Receive and pack parcels</Link>
      </div>
      {sp.error && <p className="err" role="alert">{sp.error}</p>}
      {sp.msg && <p className="ok" role="status">{sp.msg}</p>}
      <div className="two">
        <div>
          <form method="get" action="/admin" role="search">
            <label htmlFor="sq">Search by tracking number, customer or goods</label>
            <input id="sq" name="q" type="search" defaultValue={q} />
          </form>
          <div style={{ marginTop: 12 }}>
            {list.length ? (
              list.map((s) => (
                <div className="item" key={s.id}>
                  <div>
                    <b>{s.tracking_no}</b> <span className="mut">{s.customer_email}</span>
                    <p>{s.goods}</p>
                  </div>
                  <div className="row center">
                    <Pill status={s.status} />
                    <Link className="btn" href={`/admin?edit=${s.id}`}>Edit</Link>
                    <Link className="btn" href={`/shipments/${s.id}`}>View</Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="mut">No shipments found.</p>
            )}
          </div>

          <details className="card" style={{ marginTop: 20 }}>
            <summary><b>New shipment</b></summary>
            <form action={createShipment}>
              <label htmlFor="n1">Customer email</label>
              <input id="n1" name="email" type="email" required maxLength={200} />
              <label htmlFor="n2">Goods</label>
              <input id="n2" name="goods" required maxLength={500} />
              <label htmlFor="n3">Mode</label>
              <select id="n3" name="mode">
                {MODES.map((m) => <option key={m}>{m}</option>)}
              </select>
              <label htmlFor="n4">Delivery</label>
              <input id="n4" name="delivery" placeholder="Door delivery, Lagos" maxLength={200} />
              <p style={{ marginTop: 14 }}><button className="btn pri">Create shipment</button></p>
            </form>
          </details>

          <div className="card" style={{ marginTop: 20 }}>
            <h2 className="h-sm">Latest quote requests</h2>
            {((quotes ?? []) as QuoteRequest[]).length ? (
              ((quotes ?? []) as QuoteRequest[]).map((r) => (
                <div className="item" key={r.id}>
                  <div>
                    <b>{r.name}</b> <span className="mut">{r.phone} · {r.mode} · {fmtDate(r.created_at)}</span>
                    <p>{r.goods}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="mut">No requests yet.</p>
            )}
          </div>
        </div>

        {current && (
          <form className="card" action={updateShipment} key={current.id}>
            <h2 className="h-sm">Update {current.tracking_no}</h2>
            <p className="mut small">{current.customer_email}</p>
            <input type="hidden" name="id" value={current.id} />
            <label htmlFor="u1">Status</label>
            <select id="u1" name="status" defaultValue={String(current.status)}>
              {STATUSES.map((t, i) => <option key={t} value={i}>{t}</option>)}
            </select>
            <label htmlFor="u2">Weight (kg)</label>
            <input id="u2" name="weight" type="number" min="0" step="0.01" defaultValue={current.weight_kg ?? ""} />
            <label htmlFor="u3">Note for the customer (optional)</label>
            <textarea id="u3" name="note" rows={2} maxLength={500} />
            <label htmlFor="u4">Photos (images, max 5 MB each)</label>
            <input id="u4" name="photos" type="file" accept="image/*" multiple />
            <p style={{ marginTop: 14 }}><button className="btn pri">Save update</button></p>
          </form>
        )}
      </div>
    </div>
  );
}
