"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { MAX_PHOTOS_PER_UPDATE, MAX_PHOTO_BYTES, MODES, PHOTO_BUCKET, STATUSES, cleanTracking } from "@/lib/constants";

const enc = encodeURIComponent;
const str = (v: FormDataEntryValue | null, max = 500) =>
  (typeof v === "string" ? v : "").trim().slice(0, max);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function createShipment(fd: FormData) {
  const { supabase } = await requireAdmin();

  const email = str(fd.get("email"), 200).toLowerCase();
  const goods = str(fd.get("goods"), 500);
  const mode = str(fd.get("mode"), 10);
  const delivery = str(fd.get("delivery"), 200) || "To be confirmed";

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !goods || !(MODES as readonly string[]).includes(mode))
    redirect(`/admin?error=${enc("Enter a valid customer email, goods and mode.")}`);

  const { data: profile } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();

  const { data, error } = await supabase
    .from("shipments")
    .insert({ customer_email: email, customer_id: profile?.id ?? null, goods, mode, delivery })
    .select("id")
    .single();
  if (error || !data) redirect(`/admin?error=${enc("Could not create the shipment.")}`);

  await supabase.from("shipment_events").insert({ shipment_id: data.id, status: 0 });
  revalidatePath("/admin");
  redirect(`/admin?edit=${data.id}&msg=${enc("Shipment created.")}`);
}

export async function updateShipment(fd: FormData) {
  const { supabase } = await requireAdmin();

  const id = str(fd.get("id"), 50);
  const status = Number(str(fd.get("status"), 3));
  const note = str(fd.get("note"), 500);
  const weightRaw = str(fd.get("weight"), 12);
  const weight = weightRaw === "" ? null : Number(weightRaw);

  if (!UUID.test(id) || !Number.isInteger(status) || status < 0 || status >= STATUSES.length)
    redirect(`/admin?error=${enc("Invalid update.")}`);
  if (weight !== null && (!Number.isFinite(weight) || weight < 0))
    redirect(`/admin?edit=${id}&error=${enc("Weight must be a positive number.")}`);

  const { data: current } = await supabase.from("shipments").select("status").eq("id", id).single();
  if (!current) redirect(`/admin?error=${enc("Shipment not found.")}`);

  const { error } = await supabase.from("shipments").update({ status, weight_kg: weight }).eq("id", id);
  if (error) redirect(`/admin?edit=${id}&error=${enc("Could not save the update.")}`);

  if (status !== current.status || note) {
    await supabase.from("shipment_events").insert({ shipment_id: id, status, note: note || null });
  }

  const files = fd
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, MAX_PHOTOS_PER_UPDATE);

  let failed = 0;
  for (const file of files) {
    if (!file.type.startsWith("image/") || file.size > MAX_PHOTO_BYTES) {
      failed++;
      continue;
    }
    const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "jpg";
    const path = `${id}/${crypto.randomUUID()}.${ext}`;
    const up = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, { contentType: file.type });
    if (up.error) {
      failed++;
      continue;
    }
    const ins = await supabase.from("shipment_photos").insert({ shipment_id: id, path });
    if (ins.error) failed++;
  }

  revalidatePath(`/shipments/${id}`);
  revalidatePath("/admin");
  const msg = failed ? `Saved. ${failed} photo(s) were skipped (images only, max 5 MB each).` : "Saved.";
  redirect(`/admin?edit=${id}&msg=${enc(msg)}`);
}

type ProfileRef = { full_name: string | null; email: string } | null;

export async function receiveParcel(fd: FormData) {
  const { supabase } = await requireAdmin();
  const tracking = cleanTracking(str(fd.get("tracking"), 80));
  const note = str(fd.get("note"), 300);
  if (tracking.length < 5) redirect(`/admin/parcels?error=${enc("Enter the tracking number on the parcel.")}`);

  const { data: found } = await supabase
    .from("incoming_parcels")
    .select("id,status,customer_id,profiles(full_name,email)")
    .ilike("china_tracking_no", tracking)
    .maybeSingle();

  if (found) {
    const owner = found.profiles as unknown as ProfileRef;
    const who = owner ? owner.full_name || owner.email : "an unassigned customer";
    if (found.status !== "expected")
      redirect(`/admin/parcels?error=${enc(`${tracking} was already marked ${found.status}. Customer: ${who}.`)}`);
    const { error } = await supabase
      .from("incoming_parcels")
      .update({ status: "received", received_at: new Date().toISOString() })
      .eq("id", found.id);
    if (error) redirect(`/admin/parcels?error=${enc("Could not mark the parcel as received.")}`);
    revalidatePath("/admin/parcels");
    redirect(`/admin/parcels?msg=${enc(`Matched: ${tracking} belongs to ${who}.`)}`);
  }

  const { error } = await supabase.from("incoming_parcels").insert({
    customer_id: null,
    description: note || "Unidentified goods",
    china_tracking_no: tracking,
    status: "received",
    received_at: new Date().toISOString(),
  });
  if (error) redirect(`/admin/parcels?error=${enc("Could not save the parcel.")}`);
  revalidatePath("/admin/parcels");
  redirect(`/admin/parcels?msg=${enc(`No customer has added ${tracking} yet. Saved as unclaimed.`)}`);
}

export async function assignParcel(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(fd.get("id"), 50);
  const email = str(fd.get("email"), 200).toLowerCase();
  if (!UUID.test(id)) redirect("/admin/parcels");
  const { data: profile } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
  if (!profile) redirect(`/admin/parcels?error=${enc("No customer account with that email.")}`);
  await supabase.from("incoming_parcels").update({ customer_id: profile.id }).eq("id", id);
  revalidatePath("/admin/parcels");
  redirect(`/admin/parcels?msg=${enc("Parcel assigned.")}`);
}

export async function packParcels(fd: FormData) {
  const { supabase } = await requireAdmin();
  const customerId = str(fd.get("customer"), 50);
  const ids = fd.getAll("parcel").map(String).filter((v) => UUID.test(v));
  const mode = str(fd.get("mode"), 10);
  const delivery = str(fd.get("delivery"), 200) || "To be confirmed";

  if (!UUID.test(customerId) || !ids.length || !(MODES as readonly string[]).includes(mode))
    redirect(`/admin/parcels?error=${enc("Select at least one parcel and a mode.")}`);

  const { data: profile } = await supabase.from("profiles").select("email").eq("id", customerId).single();
  const { data: parcels } = await supabase
    .from("incoming_parcels")
    .select("id,description,received_at")
    .in("id", ids)
    .eq("customer_id", customerId)
    .eq("status", "received")
    .is("shipment_id", null);
  if (!profile || !parcels?.length) redirect(`/admin/parcels?error=${enc("Those parcels are no longer available.")}`);

  const goods = `${parcels.length} parcel${parcels.length > 1 ? "s" : ""}: ${parcels
    .map((p) => p.description)
    .join("; ")}`.slice(0, 500);

  const { data: ship, error } = await supabase
    .from("shipments")
    .insert({ customer_id: customerId, customer_email: profile.email, goods, mode, delivery, status: 1 })
    .select("id,tracking_no")
    .single();
  if (error || !ship) redirect(`/admin/parcels?error=${enc("Could not create the shipment.")}`);

  const first =
    parcels.map((p) => p.received_at).filter((x): x is string => !!x).sort()[0] ?? new Date().toISOString();
  await supabase.from("shipment_events").insert([
    { shipment_id: ship.id, status: 0, created_at: first },
    { shipment_id: ship.id, status: 1 },
  ]);
  await supabase
    .from("incoming_parcels")
    .update({ shipment_id: ship.id, status: "packed" })
    .in("id", parcels.map((p) => p.id));

  revalidatePath("/admin");
  revalidatePath("/admin/parcels");
  redirect(`/admin?edit=${ship.id}&msg=${enc(`Shipment ${ship.tracking_no} created. Send this tracking number to the customer.`)}`);
}
