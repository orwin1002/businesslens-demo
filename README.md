# BusinessLens demo

A throwaway website that tests every part of the BusinessLens stack together before the real build starts. All firms on it are made up.

| Part | What it does here | Service |
|---|---|---|
| Next.js | The web pages | Vercel |
| Payload CMS | Admin panel at `/admin`, sign-up, sign-in, password reset, email confirmation | runs inside Next.js on Vercel |
| PostgreSQL | Stores firms, users and reviews | Render |
| Meilisearch | Typo-tolerant search ("capitl" finds "Capital") | Meilisearch Cloud |
| Email | Confirm-your-email, password reset, review emails | Resend (or Postmark) |
| Cloudflare | Your domain name, sitting in front of the site | Cloudflare |

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
3. On the project page, copy the **Database URL**. This is your **MEILI_HOST**.
4. Copy the **Default Admin API Key**. This is your **MEILI_API_KEY**.

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
- [ ] **Sign up** with the email from Step 2. You should get a "Confirm your account" email. Click the link.
- [ ] **Sign in.** Your name appears top right.
- [ ] Open a firm and **write a review**. You should get a "We received your review" email.
- [ ] In `/admin` → **Reviews**, open the review, set **Status** to `approved` and click **Save**. You should get a "Your review is live" email, and the review appears on the firm page with its star score.
- [ ] Sign out, then use **Forgot your password?** The reset email should arrive, and the new password should work.
- [ ] On `/status`, click **Send me a test email**.
- [ ] As admin, add a new firm in `/admin` → **Firms**, then search for it. It should show up straight away.
- [ ] Open `/sitemap.xml`. It should list every firm page (this is for SEO).

### Step 7. Your own domain through Cloudflare (optional, needs a domain)

This step needs a domain name you own. You can buy one at cost on Cloudflare (**Domain Registration** → **Register Domains**, about $10 a year for a `.com`).

1. Sign up at [dash.cloudflare.com](https://dash.cloudflare.com). Click **Add a domain**, type your domain and choose the **Free** plan.
   If you bought the domain somewhere else, Cloudflare shows you two *nameservers*. Paste them into your domain seller's settings. This can take up to a few hours to take effect.
2. In **Vercel** → your project → **Settings** → **Domains**, add `demo.yourdomain.com`. Vercel shows a **CNAME** value, usually `cname.vercel-dns.com` or a longer one specific to your project.
3. In **Cloudflare** → your domain → **DNS** → **Records** → **Add record**:
   Type `CNAME`, Name `demo`, Target = the value Vercel showed. Leave the cloud **orange (Proxied)** so traffic goes through Cloudflare.
4. In **Cloudflare** → **SSL/TLS** → **Overview**, set the mode to **Full (strict)**.
5. In **Vercel** → **Settings** → **Environment Variables**, add `SITE_URL` = `https://demo.yourdomain.com`. Then go to **Deployments** → the newest one → **⋯** → **Redeploy**.
6. Open `https://demo.yourdomain.com/status`. The **Cloudflare** row should now show a tick and your country.

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
- `src/migrations/`: database changes, applied automatically when the site starts.
