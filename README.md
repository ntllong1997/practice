# Nail Salon Check-in

Walk-in queue for a nail salon.

- **Customers** scan the QR code at the front desk, optionally type their name, pick services from the menu (grouped under **Pedicure** and **Nails**), and get a queue number (they screenshot it). The ticket also shows how many people are ahead of them.
- **Technicians** share one dashboard (`/dashboard`) protected by a staff PIN. Tap a service to start it (card turns **red**), tap again when done (card turns **green** if the customer still has another service, **blue** when everything is done).
- **Service menu** (`/dashboard/services`, staff PIN): staff add, rename or remove services under the two categories, Pedicure and Nails.
- **Front-desk screen** (`/qr`) shows a QR code that changes every 60 seconds, so people can't check in from home with an old link.

Numbers restart at **#1 every day** (salon time zone, America/Chicago by default).

👉 Employee instructions: [STAFF_GUIDE.md](STAFF_GUIDE.md)

## Pages

| URL | Who | What |
|---|---|---|
| `/qr` | Front-desk tablet/TV (staff PIN) | Rotating check-in QR code |
| `/enter?k=…` | Customer's phone (from QR) | Validates the code, then redirects to `/` |
| `/` | Customer | Check-in form, then their ticket |
| `/dashboard` | Technicians (staff PIN) | Live list of today's customers |
| `/dashboard/services` | Staff (staff PIN) | Edit the service menu |

## Tech

- Next.js (App Router) + React + Tailwind CSS, deployed on Vercel
- Supabase Postgres. Tables live in a private `salon` schema; the app only calls `public.salon_*` functions from the server, and each function requires `SALON_SECRET`. See [`supabase/migrations/`](supabase/migrations).
- The dashboard refreshes every 3 seconds, so all technician devices stay in sync.

## Environment variables

All are server-only. Set them in Vercel → Project → Settings → Environment Variables (and in `.env.local` for local dev; see `.env.local.example`).

| Name | Value |
|---|---|
| `SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase publishable (or legacy anon) key |
| `SALON_SECRET` | Long random string; its hash is stored in `salon.settings.app_key_hash` |
| `NEXT_PUBLIC_SALON_NAME` | Optional, shown on the check-in and QR pages |

## Database setup (new Supabase project)

1. Run the files in `supabase/migrations/` in order (`0001_…`, then `0002_…`) in the Supabase SQL editor.
2. Create the settings row (replace the values):

   ```sql
   insert into salon.settings (id, timezone, app_key_hash, staff_pin_hash)
   values (1, 'America/Chicago',
     extensions.crypt('YOUR_SALON_SECRET', extensions.gen_salt('bf')),
     extensions.crypt('YOUR_PIN', extensions.gen_salt('bf')));
   ```

### Change the staff PIN

Changing the PIN signs out every device.

```sql
update salon.settings set staff_pin_hash = extensions.crypt('NEW_PIN', extensions.gen_salt('bf'));
```

### Rotate SALON_SECRET

```sql
update salon.settings set app_key_hash = extensions.crypt('NEW_SECRET', extensions.gen_salt('bf'));
```

Then update `SALON_SECRET` in Vercel and redeploy.

### Change the time zone

```sql
update salon.settings set timezone = 'America/New_York';
```

## Deploy on Vercel

1. vercel.com → **Add New… → Project** → import this GitHub repo (framework: Next.js, default settings).
2. Add the environment variables above.
3. Deploy. Open `https://<your-app>.vercel.app/qr` on the front-desk tablet and `…/dashboard` on technician devices.

## Local development

```bash
cp .env.local.example .env.local   # fill in values
npm install
npm run dev
```

`npm run lint` and `npm run build` should both pass before pushing.
