# CAF Logistics

Website and customer portal for CAF Logistics, a China to Nigeria freight business (air and sea).

**Features**
- Public site: services, how it works, quote request form, WhatsApp link
- Customer accounts: each customer sees only their own shipments, a progress timeline and warehouse photos
- Admin area: create shipments, update status and weight, add notes, upload photos, read quote requests
- No online payment, price calculator or automatic messaging (by design)

**Stack:** Next.js 14 (App Router), TypeScript, Supabase (Postgres, Auth, Storage, Row Level Security)

## Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste the contents of `supabase/schema.sql` and run it.
3. In **Authentication > Providers > Email**, keep email sign-in on. For launch, leave "Confirm email" on, and set **Authentication > URL Configuration > Site URL** to your live domain.
4. Copy `.env.example` to `.env.local` and fill in the Supabase URL and anon key (**Project Settings > API**), plus the WhatsApp number and addresses.
5. Install and run:
   ```bash
   npm install
   npm run dev
   ```
6. Sign up on the site, then make that account the admin in the SQL editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
   Add the Guangzhou staff member the same way (they sign up first, then you promote them).

## How shipments reach customers

An admin creates a shipment for a customer's email. If the customer already has an account it shows up straight away; if not, it links automatically when they sign up with that email.

## Security notes

- Access control is enforced in the database with Row Level Security, not only in the UI.
- Photos live in a private bucket and are shown through short-lived signed URLs.
- Only the public anon key is used in this app. Never commit `.env.local` or a service role key.
- Admin pages and server actions re-check the admin role on every request.

## Deploy

Works on Vercel, or any host that runs Next.js. Add the same environment variables from `.env.example` in the host's settings, and add your live domain to the Supabase Site URL and redirect list.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run typecheck` | TypeScript check |
