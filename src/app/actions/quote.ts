"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const str = (v: FormDataEntryValue | null, max: number) =>
  (typeof v === "string" ? v : "").trim().slice(0, max);

export async function requestQuote(fd: FormData) {
  const name = str(fd.get("name"), 100);
  const phone = str(fd.get("phone"), 30);
  const goods = str(fd.get("goods"), 1000);
  const mode = ["Air", "Sea", "Not sure"].includes(str(fd.get("mode"), 10))
    ? str(fd.get("mode"), 10)
    : "Not sure";

  if (!name || !phone || !goods) redirect("/?quote=invalid#quote");

  const supabase = createClient();
  const { error } = await supabase.from("quote_requests").insert({ name, phone, goods, mode });
  redirect(error ? "/?quote=error#quote" : "/?quote=sent#quote");
}
