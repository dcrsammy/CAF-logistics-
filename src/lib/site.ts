const digits = (s: string | undefined) => (s ?? "").replace(/\D/g, "");

export const SITE = {
  name: "Dinma Logistics",
  whatsapp: digits(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER) || "2348164257778",
  guangzhou:
    process.env.NEXT_PUBLIC_GUANGZHOU_ADDRESS ??
    "广州市越秀区广园西路27号国太国际商贸城五楼5138档 (G L T CO LTD)",
  chinaPhones: ["+86 130 7671 7942", "+86 195 8746 4550"],
  lagos: process.env.NEXT_PUBLIC_LAGOS_ADDRESS ?? "[Lagos office address]",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "",
};

export const rmbLink = () =>
  `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent("Hello, I need RMB.")}`;

export const whatsappLink = () =>
  SITE.whatsapp ? `https://wa.me/${SITE.whatsapp}` : "https://wa.me/";

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
