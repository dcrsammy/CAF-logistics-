import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Pill from "@/components/Pill";
import { requireUser } from "@/lib/auth";
import { PHOTO_BUCKET, STATUSES } from "@/lib/constants";
import { fmtDate, whatsappLink } from "@/lib/site";
import type { Shipment, ShipmentEvent, ShipmentPhoto } from "@/lib/types";

export const metadata: Metadata = { title: "Shipment" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ShipmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, role } = await requireUser();
  if (!UUID.test(id)) notFound();

  // Row level security guarantees customers can only read their own shipments.
  const { data } = await supabase.from("shipments").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const s = data as Shipment;

  const [{ data: ev }, { data: ph }] = await Promise.all([
    supabase.from("shipment_events").select("*").eq("shipment_id", s.id).order("created_at"),
    supabase.from("shipment_photos").select("*").eq("shipment_id", s.id).order("created_at"),
  ]);
  const events = (ev ?? []) as ShipmentEvent[];
  const photos = (ph ?? []) as ShipmentPhoto[];

  const signed = photos.length
    ? ((await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(photos.map((p) => p.path), 3600)).data ?? [])
    : [];

  return (
    <div className="w page">
      <p>
        <Link href={role === "admin" ? "/admin" : "/dashboard"}>Back</Link>
      </p>
      <div className="row center" style={{ margin: "14px 0 24px" }}>
        <h1>{s.tracking_no}</h1>
        <Pill status={s.status} />
      </div>
      <div className="two">
        <div className="stack">
          <div className="card">
            <h2 className="h-sm">Progress</h2>
            <ol className="tl">
              {STATUSES.map((label, i) => {
                const e = [...events].reverse().find((x) => x.status === i);
                return (
                  <li key={label} className={i <= s.status ? "on" : ""}>
                    <b>{label}</b>
                    {e && (
                      <>
                        <br />
                        <span className="mut">
                          {fmtDate(e.created_at)}
                          {e.note ? ` · ${e.note}` : ""}
                        </span>
                      </>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
          <div className="card">
            <h2 className="h-sm">Photos from the warehouse</h2>
            {signed.length ? (
              <div className="ph">
                {signed.map((p, i) =>
                  p.signedUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={p.path ?? i} src={p.signedUrl} alt={`Goods photo ${i + 1}`} loading="lazy" />
                  ) : null
                )}
              </div>
            ) : (
              <p className="mut">Photos appear here once your goods arrive in Guangzhou.</p>
            )}
          </div>
        </div>
        <div className="card">
          <h2 className="h-sm">Details</h2>
          <p><b>Goods:</b> {s.goods}</p>
          <p><b>Mode:</b> {s.mode}</p>
          <p><b>Weight:</b> {s.weight_kg != null ? `${s.weight_kg} kg` : "Set after weighing"}</p>
          <p><b>Delivery:</b> {s.delivery}</p>
          <p><b>Created:</b> {fmtDate(s.created_at)}</p>
          <p style={{ marginTop: 14 }}>
            <a href={whatsappLink()} rel="noopener noreferrer" target="_blank">Message us on WhatsApp</a>
          </p>
        </div>
      </div>
    </div>
  );
}
