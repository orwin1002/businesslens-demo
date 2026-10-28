import { headers as getHeaders } from 'next/headers.js'

import { currentUser, payloadClient } from '@/lib/payload'
import { INDEX, meili } from '@/lib/search'
import { siteURL } from '@/lib/site'
import { turnstileSiteKey } from '@/lib/turnstile'
import { reindexSearch, sendTestEmail } from '../actions'
import { Notice } from '@/components/site/CompanyList'
import type { PageProps } from '@/lib/params'

type Check = { name: string; ok: boolean | null; detail: string }

async function timed<T>(fn: () => Promise<T>): Promise<[T, number]> {
  const started = Date.now()
  const result = await fn()
  return [result, Date.now() - started]
}

export default async function Status({ searchParams }: PageProps) {
  const sp = await searchParams
  const headers = await getHeaders()
  const user = await currentUser()
  const checks: Check[] = []

  // 1. Where the website itself is running.
  checks.push(
    process.env.VERCEL
      ? { name: 'Website hosting (Vercel)', ok: true, detail: `Running on Vercel, region ${process.env.VERCEL_REGION ?? 'unknown'} (${process.env.VERCEL_ENV}).` }
      : { name: 'Website hosting (Vercel)', ok: null, detail: 'Running on this computer, not on Vercel.' },
  )

  // 2. The database.
  try {
    const payload = await payloadClient()
    const [counts, ms] = await timed(async () => ({
      companies: (await payload.count({ collection: 'companies' })).totalDocs,
      users: (await payload.count({ collection: 'users' })).totalDocs,
      reviews: (await payload.count({ collection: 'reviews' })).totalDocs,
    }))
    const host = new URL(process.env.DATABASE_URL || 'postgres://unknown').hostname
    const where = host.includes('render.com') ? 'Render' : host
    checks.push({
      name: 'Database (PostgreSQL on Render)',
      ok: true,
      detail: `Connected to ${where} in ${ms} ms. ${counts.companies} companies, ${counts.users} users, ${counts.reviews} reviews.`,
    })
  } catch (err) {
    checks.push({ name: 'Database (PostgreSQL on Render)', ok: false, detail: String(err) })
  }

  // 3. Search engine.
  const client = meili()
  if (!client) {
    checks.push({ name: 'Search (Meilisearch)', ok: null, detail: 'Not set up yet. Search uses the database instead.' })
  } else {
    try {
      const [stats, ms] = await timed(() => client.index(INDEX).getStats())
      checks.push({ name: 'Search (Meilisearch)', ok: true, detail: `Connected in ${ms} ms. ${stats.numberOfDocuments} companies in the search index.` })
    } catch (err) {
      checks.push({ name: 'Search (Meilisearch)', ok: false, detail: String(err) })
    }
  }

  // 4. Email.
  checks.push(
    process.env.SMTP_HOST
      ? { name: 'Email', ok: true, detail: `Set up to send through ${process.env.SMTP_HOST} from ${process.env.EMAIL_FROM}. Use the button below to prove it.` }
      : { name: 'Email', ok: null, detail: 'Not set up yet. Emails are only written to the server log.' },
  )

  // 5. Cloudflare adds a "cf-ray" header to every request it passes on.
  //    Through the Worker (cloudflare/worker.js) it arrives as "x-cf-ray" instead.
  const ray = headers.get('cf-ray') || headers.get('x-cf-ray')
  const country = headers.get('cf-ipcountry') || headers.get('x-cf-country') || '?'
  checks.push(
    ray
      ? { name: 'Cloudflare', ok: true, detail: `This request came through Cloudflare${headers.get('x-cf-ray') ? ' (via the Worker)' : ''}: ray ${ray}, visitor country ${country}.` }
      : { name: 'Cloudflare', ok: null, detail: 'This request did not come through Cloudflare. Open the site on its workers.dev address or your own domain.' },
  )

  // 6. Cloudflare Turnstile bot check.
  checks.push(
    process.env.TURNSTILE_SECRET_KEY && turnstileSiteKey()
      ? { name: 'Bot check (Turnstile)', ok: true, detail: 'Switched on for sign-up and reviews. Open the sign-up page to see it.' }
      : { name: 'Bot check (Turnstile)', ok: null, detail: 'Not set up yet. Forms work without it.' },
  )

  // 7. Sign-in.
  checks.push(
    user
      ? { name: 'Sign-in (Payload)', ok: true, detail: `You are signed in as ${user.email} (${user.role}).` }
      : { name: 'Sign-in (Payload)', ok: null, detail: 'You are not signed in.' },
  )

  return (
    <div className="wrap section" style={{ maxWidth: 900 }}>
      <h1>System status</h1>
      <p className="muted">Site address: {siteURL()}</p>
      <Notice message={sp.message} error={sp.error} />
      <div className="table-wrap" style={{ marginBottom: 16 }}><table className="data status-table">
        <tbody>
          {checks.map((c) => (
            <tr key={c.name}>
              <td className={c.ok === true ? 'good' : c.ok === false ? 'bad' : 'wait'}>
                {c.ok === true ? '✓' : c.ok === false ? '✗' : '–'}
              </td>
              <th>{c.name}</th>
              <td>{c.detail}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
      <div className="row">
        {user && (
          <form action={sendTestEmail}>
            <button className="btn">Send me a test email</button>
          </form>
        )}
        {user?.role === 'admin' && client && (
          <form action={reindexSearch}>
            <button className="btn secondary">Rebuild search index</button>
          </form>
        )}
        <a href="/sitemap.xml">sitemap.xml</a>
        <a href="/robots.txt">robots.txt</a>
      </div>
    </div>
  )
}
