# BusinessLens demo

A throwaway website that tests every part of the BusinessLens stack together before the real build starts. All firms on it are made up.

| Part | What it does here | Service |
|---|---|---|
| Next.js | The web pages | Vercel |
| Payload CMS | Admin panel at `/admin`, sign-up, sign-in, password reset, email confirmation | runs inside Next.js on Vercel |
| PostgreSQL | Stores firms, users and reviews | Render |
| Meilisearch | Typo-tolerant search ("capitl" finds "Capital") | Meilisearch Cloud |
| Email | Confirm-your-email, password reset, review emails | Resend (or Postmark) |
| Cloudflare | Sits in front of the site; "Verify you are human" check on sign-up and reviews | Cloudflare (Worker + Turnstile) |

Open **`/status`** on the live site. It checks each part and shows a green tick when that part is connected.

---

## Setup, step by step

Do the steps in this order. Each one gives you a value to paste into Vercel in Step 4. Keep a notepad open for them.

### Step 1. Database on Render (5 min)

1. Sign up at [render.com](https://render.com) (you can use "Sign in with GitHub").
2. Click **New +** → **Postgres**.
3. Name: `businesslens-demo-db`. Region: **Frankfurt (EU Central)**. Instance type: **Free**.
4. Click **Create Database** and wait until it says *Available* (1 to 2 minutes).
5. Open **Connect** (top right) → **External** tab → copy the **External Database URL**.
6. In your notepad, add `?sslmode=require` to the end of that address. It now looks like
   `postgresql://user:password@dpg-xxxx-a.frankfurt-postgres.render.com/dbname?sslmode=require`.
   This is your **DATABASE_URL**.

> The free Render database is deleted after 30 days. That's fine for a demo. The real site will use a paid plan.

### Step 2. Email with Resend (5 min)

For the demo we use Resend, because it sends straight away with no approval wait. The code uses standard SMTP, so switching to Postmark for the real site means changing four settings and nothing else.

1. Sign up at [resend.com](https://resend.com) **with the email address you'll test with** (your Gmail is fine).
2. Go to **API Keys** → **Create API Key** → give it any name → copy the key (it starts with `re_`).
3. Note these down:
   - `SMTP_HOST` = `smtp.resend.com`
   - `SMTP_PORT` = `465`
   - `SMTP_USER` = `resend`
   - `SMTP_PASS` = your `re_...` key
   - `EMAIL_FROM` = `onboarding@resend.dev`

> Until you verify your own domain in Resend, it only delivers to the email you signed up with. So sign up on the demo site with that same address.

### Step 3. Search with Meilisearch Cloud (5 min, optional)

You can skip this step: search still works without it, using the database instead (but without typo tolerance).

1. Sign up at [cloud.meilisearch.com](https://cloud.meilisearch.com). It has a free 14-day trial.
2. Create a project. Pick the region closest to Frankfurt and the smallest size.
3. On the project's **Overview** page, copy the **URL** (it looks like `https://ms-xxxx.fra.meilisearch.io`). This is your **MEILI_HOST**.
4. Copy the **Default Admin API Key**. It's on the same page, or under **Settings** → **API Keys**. This is your **MEILI_API_KEY**. Use the Admin key, not the Search key.

### Step 4. Put the site live on Vercel (10 min)

1. Sign up at [vercel.com](https://vercel.com/signup) with **Continue with GitHub**.
2. Click **Add New…** → **Project**. Find `businesslens-demo` and click **Import**.
   If it isn't listed, click **Adjust GitHub App Permissions** and give Vercel access to that repo.
3. Leave the build settings as they are. Vercel detects Next.js by itself.
4. Open **Environment Variables** and add each one below (Name on the left, value on the right):

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | from Step 1 |
   | `PAYLOAD_SECRET` | a long random string. Get one from [generate-secret.vercel.app/32](https://generate-secret.vercel.app/32) |
   | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | from Step 2 |
   | `MEILI_HOST`, `MEILI_API_KEY` | from Step 3 (skip if you skipped Step 3) |

5. Click **Deploy** and wait 2 to 3 minutes. When it says *Congratulations*, click the preview to open your site. The address looks like `businesslens-demo-xxxx.vercel.app`.

The first time the site opens, it creates the database tables and adds 6 made-up firms by itself.

### Step 5. Claim the admin account straight away

Open `https://<your-site>.vercel.app/admin`. Payload asks you to **create the first user**. That first user becomes the admin, so do this right away, before anyone else finds the site.

### Step 6. Test everything

Go through this list on the live site:

- [ ] `/status` shows ticks for **Vercel**, **Database** and **Search**.
- [ ] Search for `capitl` (typo on purpose). "Demo Capital Markets Ltd" should come up.
- [ ] **Sign up** with the email from Step 2. You should get a "Confirm your account" email. Click the link, then **Confirm my email**.
- [ ] **Sign in.** Your name appears top right.
- [ ] Open a firm and **write a review**. You should get a "We received your review" email.
- [ ] In `/admin` → **Reviews**, open the review, set **Status** to `approved` and click **Save**. You should get a "Your review is live" email, and the review appears on the firm page with its star score.
- [ ] Sign out, then use **Forgot your password?** The reset email should arrive, and the new password should work.
- [ ] On `/status`, click **Send me a test email**.
- [ ] As admin, add a new firm in `/admin` → **Firms**, then search for it. It should show up straight away.
- [ ] Open `/sitemap.xml`. It should list every firm page (this is for SEO).

### Step 7. Cloudflare without buying a domain (15 min)

This puts the site behind Cloudflare and adds Cloudflare's "Verify you are human" check. Neither needs a domain.

**7a. Put the site behind Cloudflare with a Worker**

1. Sign up at [dash.cloudflare.com](https://dash.cloudflare.com) (free).
2. In the left menu, open **Workers & Pages** (it may sit under **Compute**). Click **Create** → **Start with Hello World** (or **Create Worker**).
3. Name it `buisnesslens-demo` and click **Deploy**.
4. Click **Edit code**. Delete everything in the editor and paste in the whole of [`cloudflare/worker.js`](cloudflare/worker.js) from this repo.
5. On the `const ORIGIN = ...` line, replace `https://YOUR-SITE.vercel.app` with your real Vercel address, for example `https://businesslens-demo-abc123.vercel.app`.
6. Click **Deploy**. Cloudflare shows the Worker's address, for example `https://buisnesslens-demo.yourname.workers.dev`. Copy it.

**7b. Turn on the "Verify you are human" check (Turnstile)**

1. In the Cloudflare left menu, open **Turnstile** (it may sit under **Application security**). Click **Add widget**.
2. Widget name: `businesslens-demo`. Under **Hostnames**, add both addresses without `https://`:
   `businesslens-demo-abc123.vercel.app` and `buisnesslens-demo.yourname.workers.dev`.
3. Widget mode: **Managed**. Click **Create**.
4. Copy the **Site Key** and the **Secret Key**.

**7c. Tell the site about both**

1. In **Vercel** → your project → **Settings** → **Environment Variables**, add:

   | Name | Value |
   |---|---|
   | `SITE_URL` | your Worker address from 7a, e.g. `https://buisnesslens-demo.yourname.workers.dev` |
   | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | the Site Key from 7b |
   | `TURNSTILE_SECRET_KEY` | the Secret Key from 7b |

2. Go to **Deployments** → the newest one → **⋯** → **Redeploy**.
3. Open `https://buisnesslens-demo.yourname.workers.dev/status`. The **Cloudflare** row should show a tick, "via the Worker", and your country. The **Bot check** row should show a tick.
4. Open **Sign up**. A small Cloudflare box appears above the button. Wait for its tick, then sign up as usual. Email links now point to the Worker address too.

> **What this does not cover:** firewall rules, "Under Attack" mode, bot-fight mode and rate limits. Those settings pages only exist for a domain you've added to Cloudflare. A `workers.dev` address belongs to Cloudflare, so you can't change its settings. We set those up once the real BusinessLens domain is bought.

### Step 8. Later: the real domain

Once a domain is bought (for example on Cloudflare: **Domain Registration** → **Register Domains**):

1. In **Vercel** → **Settings** → **Domains**, add `demo.yourdomain.com`. Vercel shows a **CNAME** value.
2. In **Cloudflare** → your domain → **DNS** → **Records**, add a `CNAME` record named `demo` pointing to that value, with the orange cloud (**Proxied**) on.
3. In **Cloudflare** → **SSL/TLS** → **Overview**, set the mode to **Full (strict)**.
4. Change `SITE_URL` in Vercel to `https://demo.yourdomain.com`, add that hostname to the Turnstile widget, and redeploy. The Worker is no longer needed.

---

## When something goes wrong

- **Vercel build or `/status` says it can't connect to the database:** check that `DATABASE_URL` is the *External* URL (it contains `frankfurt-postgres.render.com`) and ends with `?sslmode=require`. After any change to a variable, redeploy.
- **An error mentioning "certificate":** send the exact message to Claude.
- **Emails don't arrive:** check the spam folder. Make sure you signed up on the demo with the same email you used for Resend. Resend → **Emails** shows every send attempt and why it failed.
- **The search row shows a cross:** check `MEILI_HOST` starts with `https://` and that you used the *Admin* key. Then, as admin, click **Rebuild search index** on `/status`.
- **Logs:** Vercel → your project → **Logs** shows every error the site hit.

## Running it on your own computer

You need Node.js 24 and Docker.

```bash
docker compose up -d          # starts PostgreSQL and Meilisearch
cp .env.example .env          # then set MEILI_HOST=http://127.0.0.1:7700 and MEILI_API_KEY=devmasterkey1234567890
pnpm install
pnpm dev                      # open http://localhost:3000
```

## Where things are in the code

- `src/collections/`: the database tables (Users, Firms, Reviews), who may read or change them, and the emails they send.
- `src/app/(frontend)/`: the public pages. `actions.ts` holds every form action (sign-up, sign-in, review and so on).
- `src/app/(frontend)/status/page.tsx`: the status checks.
- `src/lib/search.ts`: keeps Meilisearch in step with the database.
- `src/lib/turnstile.ts` and `src/app/(frontend)/Turnstile.tsx`: the Cloudflare robot check.
- `cloudflare/worker.js`: the Worker that puts the site behind Cloudflare.
- `src/migrations/`: database changes, applied automatically when the site starts.
