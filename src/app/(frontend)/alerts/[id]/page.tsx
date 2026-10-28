import Link from 'next/link'
import { notFound } from 'next/navigation.js'

import { Crumbs } from '@/components/site/CompanyList'
import { fmtDate } from '@/lib/format'
import { payloadClient } from '@/lib/payload'

type Props = { params: Promise<{ id: string }> }

async function load(id: string) {
  const payload = await payloadClient()
  const a = await payload.findByID({ collection: 'alerts', id: Number(id), depth: 1 }).catch(() => null)
  if (!a) notFound()
  return a
}

export async function generateMetadata({ params }: Props) {
  const a = await load((await params).id)
  return { title: a.title, description: a.summary ?? undefined }
}

export default async function AlertPage({ params }: Props) {
  const a = await load((await params).id)
  const reg = typeof a.regulator === 'object' ? a.regulator : null
  const company = typeof a.company === 'object' ? a.company : null
  return (
    <div className="wrap" style={{ maxWidth: 820 }}>
      <div className="page-head">
        <Crumbs items={[{ label: 'Home', href: '/' }, { label: 'Alerts', href: '/alerts' }, { label: a.title }]} />
        <span className="chip danger">⚠ {reg ? `${reg.code} warning` : 'BusinessLens notice'}</span>
        <h1 style={{ marginTop: 10 }}>{a.title}</h1>
        <p className="muted">Published {fmtDate(a.date)}{reg ? ` by the ${reg.name}` : ''}{a.active ? '' : ' · archived'}</p>
      </div>
      <div className="card">
        {a.namedEntity && <p><strong>Name in the warning:</strong> {a.namedEntity}</p>}
        <p>{a.summary}</p>
        <div className="row">
          {a.officialUrl && <a className="btn" href={a.officialUrl} target="_blank" rel="noopener noreferrer">View the official alert ↗</a>}
          {company && <Link className="btn secondary" href={`/company/${company.slug}`}>Open the company profile</Link>}
          {reg && <Link className="btn ghost" href={`/regulator/${reg.slug}`}>All {reg.code} firms</Link>}
        </div>
      </div>
      <p className="tiny muted" style={{ marginTop: 12 }}>BusinessLens reproduces the regulator’s published warning. Always check the official source.</p>
    </div>
  )
}
