-- Run this in the Supabase SQL editor AFTER schema.sql.
-- Adds: customer-registered incoming parcels (China tracking numbers), matching at the
-- warehouse, packing parcels into one shipment, and public tracking by tracking number.

create table public.incoming_parcels (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles (id) on delete set null,
  vendor text check (vendor is null or char_length(vendor) <= 100),
  description text not null check (char_length(description) between 1 and 300),
  china_tracking_no text not null check (char_length(china_tracking_no) between 5 and 60),
  status text not null default 'expected' check (status in ('expected', 'received', 'packed')),
  received_at timestamptz,
  shipment_id uuid references public.shipments (id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index incoming_parcels_tracking_uidx on public.incoming_parcels (lower(china_tracking_no));
create index incoming_parcels_customer_idx on public.incoming_parcels (customer_id, status);
create index incoming_parcels_shipment_idx on public.incoming_parcels (shipment_id);

alter table public.incoming_parcels enable row level security;

create policy "parcels: customer reads own, admin reads all" on public.incoming_parcels
  for select using (customer_id = auth.uid() or public.is_admin());
create policy "parcels: customer deletes own expected" on public.incoming_parcels
  for delete using (customer_id = auth.uid() and status = 'expected');
create policy "parcels: admin writes" on public.incoming_parcels
  for all using (public.is_admin()) with check (public.is_admin());

-- Customers add parcels through this function so that:
--  * a parcel the warehouse already received (unclaimed) is attached to the customer who registers it
--  * a tracking number can never be linked to two different customers
create or replace function public.register_parcel(p_vendor text, p_description text, p_tracking text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  t text := trim(p_tracking);
  existing public.incoming_parcels;
  pid uuid;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if char_length(t) < 5 or char_length(t) > 60 then raise exception 'invalid_tracking'; end if;
  if p_description is null or char_length(trim(p_description)) = 0 or char_length(p_description) > 300 then
    raise exception 'invalid_description';
  end if;

  select * into existing from public.incoming_parcels where lower(china_tracking_no) = lower(t) limit 1;
  if found then
    if existing.customer_id is null then
      update public.incoming_parcels
        set customer_id = uid, vendor = nullif(trim(p_vendor), ''), description = trim(p_description)
        where id = existing.id returning id into pid;
      return pid;
    elsif existing.customer_id = uid then
      raise exception 'already_registered';
    else
      raise exception 'tracking_in_use';
    end if;
  end if;

  insert into public.incoming_parcels (customer_id, vendor, description, china_tracking_no)
  values (uid, nullif(trim(p_vendor), ''), trim(p_description), t)
  returning id into pid;
  return pid;
end $$;

revoke all on function public.register_parcel(text, text, text) from public, anon;
grant execute on function public.register_parcel(text, text, text) to authenticated;

-- Public tracking by tracking number. Returns only status, mode and the timeline
-- (no customer details, goods description, notes or photos).
create or replace function public.track_shipment(p_tracking text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'tracking_no', s.tracking_no,
    'mode', s.mode,
    'status', s.status,
    'updated_at', s.updated_at,
    'events', coalesce(
      (select jsonb_agg(jsonb_build_object('status', e.status, 'at', e.created_at) order by e.created_at)
       from public.shipment_events e where e.shipment_id = s.id),
      '[]'::jsonb)
  )
  from public.shipments s
  where upper(s.tracking_no) = upper(trim(p_tracking))
  limit 1;
$$;

grant execute on function public.track_shipment(text) to anon, authenticated;
