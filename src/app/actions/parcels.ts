"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { cleanTracking } from "@/lib/constants";

const enc = encodeURIComponent;
const str = (v: FormDataEntryValue | null, max: number) =>
  (typeof v === "string" ? v : "").trim().slice(0, max);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function addParcel(fd: FormData) {
  const { supabase } = await requireUser();
  const vendor = str(fd.get("vendor"), 100);
  const description = str(fd.get("description"), 300);
  const tracking = cleanTracking(str(fd.get("tracking"), 80));

  if (!description || tracking.length < 5)
    redirect(`/orders?error=${enc("Enter what you ordered and the tracking number from the store or courier.")}`);

  const { error } = await supabase.rpc("register_parcel", {
    p_vendor: vendor || null,
    p_description: description,
    p_tracking: tracking,
  });
  if (error) {
    const m = error.message ?? "";
    const text = m.includes("already_registered")
      ? "You already added this tracking number."
      : m.includes("tracking_in_use")
        ? "This tracking number is linked to another account. Please contact us on WhatsApp."
        : "Could not add the order. Check the tracking number and try again.";
    redirect(`/orders?error=${enc(text)}`);
  }
  revalidatePath("/orders");
  redirect(`/orders?msg=${enc("Order added. We will match it when it arrives at our warehouse.")}`);
}

export async function deleteParcel(fd: FormData) {
  const { supabase } = await requireUser();
  const id = str(fd.get("id"), 50);
  if (!UUID.test(id)) redirect("/orders");
  // Row level security only allows deleting your own parcels that have not arrived yet.
  await supabase.from("incoming_parcels").delete().eq("id", id);
  revalidatePath("/orders");
  redirect(`/orders?msg=${enc("Order removed.")}`);
}
