export const STATUSES = [
  "Received in Guangzhou",
  "Packed and loaded",
  "Left China",
  "Arrived in Nigeria",
  "Customs cleared",
  "Out for delivery",
  "Delivered",
] as const;

export const MODES = ["Air", "Sea"] as const;

export const TABS: Record<string, (s: number) => boolean> = {
  All: () => true,
  "In China": (s) => s < 2,
  "In transit": (s) => s === 2,
  "In Nigeria": (s) => s >= 3 && s < 6,
  Delivered: (s) => s === 6,
};

export const PHOTO_BUCKET = "shipment-photos";
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const MAX_PHOTOS_PER_UPDATE = 8;
