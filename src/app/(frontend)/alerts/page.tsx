import Link from 'next/link'

import { Crumbs, Pager } from '@/components/site/CompanyList'
import { getRegulators } from '@/lib/directory'
import { fmtDate } from '@/lib/format'
import type { PageProps } from '@/lib/params'
import { payloadClient } from '@/lib/payload'

export const metadata = { title: 'Regulator alerts and warnings', description: 'Warnings published by financial regulators about unlicensed firms and clone websites.' }

export default async function Alerts({ searchParams }: PageProps) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  const { bySlug, all } = await getRegulators()
  const reg = sp.regulator ? bySlug.get(sp.regulator) : undefined
  const payload = await payloadClient()
  const res = await payload.find({ collection: 'alerts', where: reg ? { regulator: { equals: reg.id } } : {}, sort: '-date', page, limit: 20, depth: 1 })
  return (
    <div className="wrap" style={{ maxWidth: 900 }}>
      <div className="page-head">
        <Crumbs items={[{ label: 'Home', href: '/' }, { label: 'Alerts' }]} />
        <h1>Regulator alerts</h1>
        <p className="muted">Warnings published by regulators about firms that are not licensed, or websites pretending to be licensed firms. Each one links to the official notice.</p>
        <nav className="tabs-inline">
          <Link className={!reg ? 'on' : ''} href="/alerts">All</Link>
          {all.map((r) => <Link key={r.id} className={reg?.id === r.id ? 'on' : ''} href={`/alerts?regulator=${r.slug}`}>{r.code}</Link>)}
        </nav>
      </div>
      <div className="stack">
        {res.docs.length === 0 && <div className="card"><p className="muted" style={{ margin: 0 }}>No alerts recorded.</p></div>}
        {res.docs.map((a) => (
          <div className="card" key={a.id} style={{ marginTop: 0 }}>
            <div className="row" style={{ gap: 8 }}>
              <span className="chip danger">⚠ {typeof a.regulator === 'object' && a.regulator ? a.regulator.code : 'BusinessLens notice'}</span>
              <span className="tiny muted">{fmtDate(a.date)}</span>
              {!a.active && <span className="chip">Archived</span>}
            </div>
            <h3 style={{ margin: '8px 0 4px' }}><Link href={`/alerts/${a.id}`}>{a.title}</Link></h3>
            <p className="small muted" style={{ margin: 0 }}>{a.summary}</p>
          </div>
        ))}
      </div>
      <Pager page={page} pages={res.totalPages} href={(p) => `/alerts?${reg ? `regulator=${reg.slug}&` : ''}page=${p}`} />
    </div>
  )
}
