import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { addParcel, deleteParcel } from "@/app/actions/parcels";
import { requireUser } from "@/lib/auth";
import { PARCEL_LABEL } from "@/lib/constants";
import { SITE, fmtDate } from "@/lib/site";
import type { Parcel } from "@/lib/types";

export const metadata: Metadata = { title: "My orders" };

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; msg?: string }>;
}) {
  const sp = await searchParams;
  const { supabase, role } = await requireUser();
  if (role === "admin") redirect("/admin/parcels");

  const { data } = await supabase.from("incoming_parcels").select("*").order("created_at", { ascending: false });
  const parcels = (data ?? []) as Parcel[];

  const shipIds = [...new Set(parcels.map((p) => p.shipment_id).filter((x): x is string => !!x))];
  const { data: ships } = shipIds.length
    ? await supabase.from("shipments").select("id,tracking_no").in("id", shipIds)
    : { data: [] as { id: string; tracking_no: string }[] };
  const track = new Map((ships ?? []).map((s) => [s.id, s.tracking_no]));

  return (
    <div className="w page">
      <h1>My orders</h1>
      <p className="mut" style={{ marginBottom: 20 }}>
        Add each item you ordered in China with the tracking number from the store or courier. When it reaches our
        warehouse we match it to your account, so nothing gets mixed up.
      </p>
      {sp.error && <p className="err" role="alert">{sp.error}</p>}
      {sp.msg && <p className="ok" role="status">{sp.msg}</p>}

      <div className="two">
        <div>
          {parcels.length ? (
            parcels.map((p) => (
              <div className="item" key={p.id}>
                <div>
                  <b>{p.description}</b>
                  <p className="mut small">
                    {p.vendor ? `${p.vendor} · ` : ""}Tracking {p.china_tracking_no}
                  </p>
                  <p className="small">
                    <span className="pill">{PARCEL_LABEL[p.status]}</span>
                    {p.received_at ? <span className="mut"> · {fmtDate(p.received_at)}</span> : null}
                  </p>
                </div>
                <div className="row center">
                  {p.shipment_id && track.get(p.shipment_id) && (
                    <Link className="btn" href={`/shipments/${p.shipment_id}`}>
                      Shipment {track.get(p.shipment_id)}
                    </Link>
                  )}
                  {p.status === "expected" && (
                    <form action={deleteParcel}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="btn" aria-label={`Remove ${p.description}`}>Remove</button>
                    </form>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="card">
              <h3>No orders added yet</h3>
              <p className="mut">Add your first order using the form.</p>
            </div>
          )}
        </div>

        <div className="stack">
          <form className="card" action={addParcel}>
            <h2 className="h-sm">Add an order</h2>
            <label htmlFor="o1">Store or vendor (optional)</label>
            <input id="o1" name="vendor" maxLength={100} placeholder="Taobao, 1688, Pinduoduo..." />
            <label htmlFor="o2">What did you order?</label>
            <input id="o2" name="description" required maxLength={300} placeholder="3 cartons of phone cases" />
            <label htmlFor="o3">China tracking number</label>
            <input id="o3" name="tracking" required minLength={5} maxLength={80} autoComplete="off" />
            <p style={{ marginTop: 14 }}><button className="btn dark">Add order</button></p>
          </form>
          <div className="card">
            <h2 className="h-sm">Our China warehouse address</h2>
            <p>{SITE.guangzhou}</p>
            <p className="mut small">{SITE.chinaPhones.join(" / ")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
