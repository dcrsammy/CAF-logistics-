const digits = (s: string | undefined) => (s ?? "").replace(/\D/g, "");

export const SITE = {
  name: "CAF Logistics",
  whatsapp: digits(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER),
  guangzhou: process.env.NEXT_PUBLIC_GUANGZHOU_ADDRESS ?? "[Guangzhou warehouse address]",
  lagos: process.env.NEXT_PUBLIC_LAGOS_ADDRESS ?? "[Lagos office address]",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "",
};

export const whatsappLink = () =>
  SITE.whatsapp ? `https://wa.me/${SITE.whatsapp}` : "https://wa.me/";

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
