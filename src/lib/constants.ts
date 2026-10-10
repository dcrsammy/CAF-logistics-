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

export const PARCEL_LABEL = {
  expected: "Waiting for arrival",
  received: "Received at warehouse",
  packed: "Packed into a shipment",
} as const;

// Keep tracking numbers to safe characters (letters, digits, dash).
export const cleanTracking = (s: string) => s.replace(/[^A-Za-z0-9-]/g, "").slice(0, 60);
