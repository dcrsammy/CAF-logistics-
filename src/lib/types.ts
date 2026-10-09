export type Role = "customer" | "admin";

export interface Shipment {
  id: string;
  tracking_no: string;
  customer_id: string | null;
  customer_email: string;
  goods: string;
  mode: "Air" | "Sea";
  delivery: string;
  weight_kg: number | null;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface ShipmentEvent {
  id: string;
  shipment_id: string;
  status: number;
  note: string | null;
  created_at: string;
}

export interface ShipmentPhoto {
  id: string;
  shipment_id: string;
  path: string;
  created_at: string;
}

export interface QuoteRequest {
  id: string;
  name: string;
  phone: string;
  goods: string;
  mode: string;
  created_at: string;
}
