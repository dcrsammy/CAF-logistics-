"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { MAX_PHOTOS_PER_UPDATE, MAX_PHOTO_BYTES, MODES, PHOTO_BUCKET, STATUSES } from "@/lib/constants";

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
