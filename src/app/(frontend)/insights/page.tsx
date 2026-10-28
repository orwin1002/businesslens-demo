import Link from 'next/link'

import { Crumbs } from '@/components/site/CompanyList'
import { fmtDate } from '@/lib/format'
import { payloadClient } from '@/lib/payload'

export const metadata = { title: 'Insights', description: 'Research and guides on financial institutions and regulation in the Middle East.' }

export default async function Insights() {
  const payload = await payloadClient()
  const { docs } = await payload.find({ collection: 'insights', where: { publishedAt: { exists: true } }, sort: '-publishedAt', limit: 30, depth: 0 })
  return (
    <div className="wrap" style={{ maxWidth: 960 }}>
      <div className="page-head">
        <Crumbs items={[{ label: 'Home', href: '/' }, { label: 'Insights' }]} />
        <h1>Insights</h1>
        <p className="muted">Guides and research from the BusinessLens team.</p>
      </div>
      <div className="stack" style={{ gap: 14 }}>
        {docs.map((a) => (
          <Link key={a.id} href={`/insights/${a.slug}`} className="card tile" style={{ marginTop: 0 }}>
            <span className="tiny">{fmtDate(a.publishedAt)} · {a.author}</span>
            <b style={{ fontSize: 20 }}>{a.title}</b>
            <span>{a.excerpt}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
