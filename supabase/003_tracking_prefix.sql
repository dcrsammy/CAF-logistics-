-- New shipments get the Dinma tracking prefix (DNM-1001, DNM-1002, ...).
-- Existing shipments keep their current numbers, and public tracking works for both.
alter table public.shipments
  alter column tracking_no set default ('DNM-' || nextval('public.shipment_seq'));
