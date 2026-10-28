import Link from 'next/link'
import { notFound } from 'next/navigation.js'

import { Listing } from '@/components/site/Listing'
import { countryName } from '@/lib/countries'
import { getRegulators } from '@/lib/directory'
import { fmtDate } from '@/lib/format'
import type { SP } from '@/lib/params'
import { payloadClient } from '@/lib/payload'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SP> }

async function load(slug: string) {
  const reg = (await getRegulators()).bySlug.get(slug)
  if (!reg) notFound()
  return reg
}

export async function generateMetadata({ params }: Props) {
  const reg = await load((await params).slug)
  return { title: `${reg.code}: firms licensed by the ${reg.name}`, description: reg.description ?? undefined }
}

export default async function RegulatorPage({ params, searchParams }: Props) {
  const { slug } = await params
  const reg = await load(slug)
  const payload = await payloadClient()
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString()
  const [alerts, alertsThisYear] = await Promise.all([
    payload.find({ collection: 'alerts', where: { regulator: { equals: reg.id } }, sort: '-date', limit: 5, depth: 0 }),
    payload.count({ collection: 'alerts', where: { regulator: { equals: reg.id }, date: { greater_than_equal: yearStart } } }),
  ])
  return (
    <Listing
      path={`/regulator/${slug}`}
      sp={await searchParams}
      title={reg.name}
      crumbs={[{ label: 'Home', href: '/' }, { label: 'Regulators', href: '/regulators' }, { label: reg.code }]}
      base={{ regulator: [reg.code] }}
      licenceFor={reg.code}
      quickFilter="category"
      head={
        <>
          <p style={{ maxWidth: 760 }}>{reg.description} <span className="muted">· {countryName(reg.country)}</span></p>
          <div className="row">
            {reg.registerUrl && <a className="btn secondary small" href={reg.registerUrl} target="_blank" rel="noopener noreferrer">Official public register ↗</a>}
            {reg.alertsUrl && <a className="btn secondary small" href={reg.alertsUrl} target="_blank" rel="noopener noreferrer">{reg.code} alerts ↗</a>}
            <span className="small muted">{alertsThisYear.totalDocs} alerts this year{reg.registerLastChecked ? ` · register last checked ${fmtDate(reg.registerLastChecked)}` : ''}</span>
          </div>
        </>
      }
      aside={
        <div className="card">
          <h3>Latest {reg.code} alerts</h3>
          {alerts.docs.length === 0 ? (
            <p className="small muted" style={{ margin: 0 }}>None recorded.</p>
          ) : (
            <ul style={{ paddingInlineStart: 18, margin: 0 }} className="small">
              {alerts.docs.map((a) => <li key={a.id}><Link href={`/alerts/${a.id}`}>{a.title}</Link> <span className="muted">{fmtDate(a.date)}</span></li>)}
            </ul>
          )}
        </div>
      }
    />
  )
}
