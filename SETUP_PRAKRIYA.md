# Setting up Prakriyā (the /prakriya page)

The `/prakriya` page ports the app's features to the browser: today's
priorities, habits, 4 goal categories, scripting, evening reflection, a
vision board and a mind map — all gated behind a free account.

None of it can go live yet because sign-up/login needs a real backend, and
that's something only you can create (an AI session can't provision cloud
infrastructure on your behalf). `planner.html` already referenced Supabase
before this update, so this build keeps that choice. Here's the one-time
setup — it takes about 10 minutes.

## 1. Create a Supabase project

1. Go to https://supabase.com and sign in (free tier is enough).
2. Create a new project. Pick any name/region; save the database password
   somewhere safe (you likely won't need it again for this).
3. Once it finishes provisioning, open **Project Settings → API**. You need
   two values from that page:
   - **Project URL** (looks like `https://xxxxxxxx.supabase.co`)
   - **anon public** key (a long string under "Project API keys")

## 2. Create the data table

Open **SQL Editor** in the Supabase dashboard, paste this, and run it:

```sql
create table public.prakriya_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.prakriya_data enable row level security;

create policy "Users can read their own data"
  on public.prakriya_data for select
  using (auth.uid() = user_id);

create policy "Users can insert their own data"
  on public.prakriya_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own data"
  on public.prakriya_data for update
  using (auth.uid() = user_id);
```

This mirrors the mobile app's model: everything a signed-in user does on
the Prakriya page (priorities, habits, goals, scripts, reflections, vision
board, mind map notes) is stored as one JSON object per user, and row-level
security means each user can only ever see their own row.

## 3. Turn off email confirmation (optional, recommended for launch)

By default Supabase requires clicking a confirmation email before a new
sign-up can log in. For a smoother "free, right now" experience:

**Authentication → Providers → Email** → toggle off **Confirm email**.

You can turn it back on later once you've set up a branded confirmation
email template, if you'd like.

## 4. Add your credentials to the site

Open `assets/app.js` and replace these two lines near the top:

```js
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_PUBLIC_KEY';
```

with your actual Project URL and anon public key from step 1. The anon key
is safe to ship in client-side code — it's public by design; row-level
security (step 2) is what actually protects each user's data.

Commit and push (or let Netlify redeploy) — sign-up/login and every tool
on the page go live as soon as those two values are real and the table
exists.

## What's intentionally simple for this first version

- **Vision board images are pasted URLs**, not uploads. Real image uploads
  need Supabase Storage (a bucket + policies) — a natural next step once
  the base auth/data flow above is confirmed working, but left out for now
  to keep the first working version to a single, easy setup step.
- **Feedback still goes out via your email client** (`mailto:` to
  aandccreativecompany@gmail.com), matching the mobile app — no separate
  backend needed for that piece.
- There's no native-app-style push notification or home-screen widget on
  the web (browsers don't have a direct equivalent); everything else from
  the app — habits with streaks, priorities capped at 3/day, the four goal
  categories, scripting, mood + journal reflection, and a mind-map stats
  snapshot — is here.
