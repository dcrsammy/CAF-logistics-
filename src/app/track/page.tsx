import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { STATUSES } from "@/lib/constants";
import { fmtDate } from "@/lib/site";
import type { TrackResult } from "@/lib/types";

export const metadata: Metadata = { title: "Track a shipment" };

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ no?: string }> }) {
  const no = ((await searchParams).no ?? "").trim().slice(0, 40);
  let result: TrackResult | null = null;
  if (no) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("track_shipment", { p_tracking: no });
    result = (data as TrackResult | null) ?? null;
  }
  const pct = result ? Math.round(((result.status + 1) / STATUSES.length) * 100) : 0;

  return (
    <>
      <div className="band">
        <div className="w" style={{ padding: "40px 20px" }}>
          <h1 style={{ fontSize: 36, marginBottom: 18 }}>Track a shipment</h1>
          <form className="track-row" action="/track" method="get" role="search">
            <label htmlFor="tn" className="sr-only">Tracking number</label>
            <input id="tn" name="no" placeholder="DNM-1001" defaultValue={no} required maxLength={40} autoComplete="off" />
            <button className="btn dark">Track</button>
          </form>
        </div>
      </div>

      <div className="w page">
        {no && !result && (
          <div className="card" role="status">
            <h3>No shipment found for &ldquo;{no}&rdquo;</h3>
            <p className="mut">Check the number and try again. Tracking numbers start with DNM.</p>
          </div>
        )}
        {result && (
          <div className="card">
            <div className="row center" style={{ justifyContent: "space-between" }}>
              <div>
                <p className="mut small">Tracking number</p>
                <h2 style={{ margin: 0 }}>{result.tracking_no}</h2>
              </div>
              <span className="pill">{STATUSES[result.status]}</span>
            </div>
            <p className="mut small" style={{ margin: "10px 0 14px" }}>
              {result.mode} freight · Last update {fmtDate(result.updated_at)}
            </p>
            <div className="bar-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Shipment progress">
              <div className="bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <ol className="tl" style={{ marginTop: 24 }}>
              {STATUSES.map((label, i) => {
                const e = [...result!.events].reverse().find((x) => x.status === i);
                return (
                  <li key={label} className={i <= result!.status ? "on" : ""}>
                    <b>{label}</b>
                    {e && (<><br /><span className="mut">{fmtDate(e.at)}</span></>)}
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </div>
    </>
  );
}
