import { headers as getHeaders } from 'next/headers.js'

import { currentUser, payloadClient } from '@/lib/payload'
import { INDEX, meili } from '@/lib/search'
import { siteURL } from '@/lib/site'
import { reindexSearch, sendTestEmail } from '../actions'
import { Notice, type PageProps } from '../Notice'

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
      firms: (await payload.count({ collection: 'firms' })).totalDocs,
      users: (await payload.count({ collection: 'users' })).totalDocs,
      reviews: (await payload.count({ collection: 'reviews' })).totalDocs,
    }))
    const host = new URL(process.env.DATABASE_URL || 'postgres://unknown').hostname
    const where = host.includes('render.com') ? 'Render' : host
    checks.push({
      name: 'Database (PostgreSQL on Render)',
      ok: true,
      detail: `Connected to ${where} in ${ms} ms. ${counts.firms} firms, ${counts.users} users, ${counts.reviews} reviews.`,
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
      checks.push({ name: 'Search (Meilisearch)', ok: true, detail: `Connected in ${ms} ms. ${stats.numberOfDocuments} firms in the search index.` })
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
  const ray = headers.get('cf-ray')
  checks.push(
    ray
      ? { name: 'Cloudflare', ok: true, detail: `This request came through Cloudflare (ray ${ray}, visitor country ${headers.get('cf-ipcountry') ?? '?'}).` }
      : { name: 'Cloudflare', ok: null, detail: 'This request did not come through Cloudflare. Open the site on your own domain once Cloudflare is set up.' },
  )

  // 6. Sign-in.
  checks.push(
    user
      ? { name: 'Sign-in (Payload)', ok: true, detail: `You are signed in as ${user.email} (${user.role}).` }
      : { name: 'Sign-in (Payload)', ok: null, detail: 'You are not signed in.' },
  )

  return (
    <>
      <h1>System status</h1>
      <p className="muted">Site address: {siteURL()}</p>
      <Notice message={sp.message} error={sp.error} />
      <table className="status">
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
      </table>
      <div className="row">
        {user && (
          <form action={sendTestEmail}>
            <button>Send me a test email</button>
          </form>
        )}
        {user?.role === 'admin' && client && (
          <form action={reindexSearch}>
            <button className="secondary">Rebuild search index</button>
          </form>
        )}
        <a href="/sitemap.xml">sitemap.xml</a>
        <a href="/robots.txt">robots.txt</a>
      </div>
    </>
  )
}
