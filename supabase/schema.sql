-- Dinma Logistics database schema. Run once in the Supabase SQL editor.

-- ───────────── Tables ─────────────
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null unique,
  full_name text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create sequence public.shipment_seq start 1001;

create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  tracking_no text not null unique default ('CAF-' || nextval('public.shipment_seq')),
  customer_id uuid references public.profiles (id) on delete set null,
  customer_email text not null,
  goods text not null check (char_length(goods) between 1 and 500),
  mode text not null check (mode in ('Air', 'Sea')),
  delivery text not null default 'To be confirmed',
  weight_kg numeric(10, 2) check (weight_kg is null or weight_kg >= 0),
  status smallint not null default 0 check (status between 0 and 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index shipments_customer_id_idx on public.shipments (customer_id);
create index shipments_customer_email_idx on public.shipments (lower(customer_email));

create table public.shipment_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  status smallint not null check (status between 0 and 6),
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now()
);
create index shipment_events_shipment_idx on public.shipment_events (shipment_id, created_at);

create table public.shipment_photos (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  path text not null,
  created_at timestamptz not null default now()
);
create index shipment_photos_shipment_idx on public.shipment_photos (shipment_id, created_at);

create table public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  phone text not null check (char_length(phone) between 1 and 30),
  goods text not null check (char_length(goods) between 1 and 1000),
  mode text not null default 'Not sure' check (mode in ('Air', 'Sea', 'Not sure')),
  created_at timestamptz not null default now()
);

-- ───────────── Helpers and triggers ─────────────
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger shipments_touch before update on public.shipments
for each row execute function public.touch_updated_at();

-- New signup: create the profile and link any shipments created for that email earlier.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, lower(new.email), new.raw_user_meta_data ->> 'full_name');
  update public.shipments set customer_id = new.id
  where lower(customer_email) = lower(new.email) and customer_id is null;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- ───────────── Row level security ─────────────
alter table public.profiles enable row level security;
alter table public.shipments enable row level security;
alter table public.shipment_events enable row level security;
alter table public.shipment_photos enable row level security;
alter table public.quote_requests enable row level security;

create policy "profiles: read own or admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy "shipments: customer reads own, admin reads all" on public.shipments
  for select using (customer_id = auth.uid() or public.is_admin());
create policy "shipments: admin writes" on public.shipments
  for all using (public.is_admin()) with check (public.is_admin());

-- Sub-selects below are filtered by the shipments policy above.
create policy "events: read if shipment visible" on public.shipment_events
  for select using (exists (select 1 from public.shipments s where s.id = shipment_id));
create policy "events: admin writes" on public.shipment_events
  for all using (public.is_admin()) with check (public.is_admin());

create policy "photos: read if shipment visible" on public.shipment_photos
  for select using (exists (select 1 from public.shipments s where s.id = shipment_id));
create policy "photos: admin writes" on public.shipment_photos
  for all using (public.is_admin()) with check (public.is_admin());

create policy "quotes: anyone can submit" on public.quote_requests
  for insert to anon, authenticated with check (true);
create policy "quotes: admin reads" on public.quote_requests
  for select using (public.is_admin());

-- ───────────── Photo storage (private bucket) ─────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('shipment-photos', 'shipment-photos', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic'])
on conflict (id) do nothing;

-- Files are stored as <shipment_id>/<file>. Customers can read photos of their own shipments.
create policy "photos storage: read own or admin" on storage.objects
  for select using (
    bucket_id = 'shipment-photos' and exists (
      select 1 from public.shipments s
      where s.id::text = (storage.foldername(name))[1]
        and (s.customer_id = auth.uid() or public.is_admin())
    )
  );
create policy "photos storage: admin upload" on storage.objects
  for insert with check (bucket_id = 'shipment-photos' and public.is_admin());
create policy "photos storage: admin delete" on storage.objects
  for delete using (bucket_id = 'shipment-photos' and public.is_admin());

-- ───────────── Make yourself the admin (after signing up on the site) ─────────────
-- update public.profiles set role = 'admin' where email = 'you@example.com';
