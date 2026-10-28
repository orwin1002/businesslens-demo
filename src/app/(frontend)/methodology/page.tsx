import Link from 'next/link'

import { Crumbs } from '@/components/site/CompanyList'
import { fmtDate } from '@/lib/format'
import { payloadClient } from '@/lib/payload'
import { DEFAULT_BANDS, DEFAULT_CRITERIA } from '@/lib/rating'

export const metadata = { title: 'How we rate', description: 'The BusinessLens Rating methodology: five criteria, a score out of 10, and the rules that keep it independent.' }

export default async function Methodology() {
  const payload = await payloadClient()
  const { docs } = await payload.find({ collection: 'methodologies', sort: '-updatedAt', limit: 10, depth: 1 })
  const m = docs.find((d) => d.isDefault) ?? docs[0]
  const criteria = m?.criteria?.length ? m.criteria : DEFAULT_CRITERIA
  const bands = [...(m?.bands?.length ? m.bands : DEFAULT_BANDS)].sort((a, b) => b.minScore - a.minScore)
  const total = criteria.reduce((s, c) => s + c.maxPoints, 0)
  return (
    <div className="wrap" style={{ maxWidth: 900 }}>
      <div className="page-head">
        <Crumbs items={[{ label: 'Home', href: '/' }, { label: 'How we rate' }]} />
        <h1>How the BusinessLens Rating works</h1>
        <p className="muted">Methodology {m ? `version ${m.version}, updated ${fmtDate(m.updatedAt)}` : 'version 1.0'}. Every rating shows the version it used.</p>
      </div>
      <div className="stack" style={{ gap: 16 }}>
        <div className="card">
          <h2>Five criteria, {total} points, a score out of 10</h2>
          <p>Analysts score each company on the criteria below using verified sources: regulator registers, company filings, the company’s own documents and the public record. The points are added up and divided by 10.</p>
          <div className="stack">
            {criteria.map((c) => (
              <div key={c.name}>
                <div className="row between"><strong>{c.name}</strong><span className="muted">{c.maxPoints} points</span></div>
                <div className="bar"><i style={{ width: `${(c.maxPoints / total) * 100 * 3}%`, maxWidth: '100%', background: 'var(--brand-2)' }} /></div>
                {c.description && <p className="small muted" style={{ margin: '4px 0 0' }}>{c.description}</p>}
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h2>Score bands</h2>
          <div className="chips">
            {bands.map((b) => <span key={b.label} className="badge-mini" style={{ background: b.color, padding: '6px 12px' }}>{b.label} · {b.minScore}+</span>)}
          </div>
        </div>
        <div className="card">
          <h2>Rating states</h2>
          <dl className="facts" style={{ gridTemplateColumns: '160px minmax(0,1fr)' }}>
            <dt>Not yet rated</dt><dd>Analysts have not scored the company yet. Licences and facts are still verified.</dd>
            <dt>Rated</dt><dd>A published score with its date and methodology version.</dd>
            <dt>Under review</dt><dd>Analysts are re-checking the company. The previous score stays visible until the new one is published.</dd>
            <dt>Rating suspended</dt><dd>The score is hidden while we confirm important information, for example a licence status.</dd>
          </dl>
        </div>
        <div className="card">
          <h2>What keeps it independent</h2>
          <ul>
            <li>Only analysts can enter or publish scores. Sales staff and companies cannot.</li>
            <li>Paying for a Partner profile or a Featured slot has no link to any score field.</li>
            <li>Every published change is a new version with date, analyst and reason, and is kept in the audit log.</li>
            <li>The Community Score from user reviews is shown separately and never mixed into the rating.</li>
          </ul>
          <p style={{ margin: 0 }}>Think a rating is wrong? Use “Request a rating review” on the company’s page. See also <Link href="/independence">Independence</Link> and <Link href="/complaints">Complaints and right of reply</Link>.</p>
        </div>
      </div>
    </div>
  )
}
