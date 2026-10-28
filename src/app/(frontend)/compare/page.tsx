import type React from 'react'
import Link from 'next/link'

import { Crumbs } from '@/components/site/CompanyList'
import { Avatar, CommunityScore, RatingBadge } from '@/components/site/Scores'
import { countryName } from '@/lib/countries'
import { domainOf, initials } from '@/lib/format'
import { list, type PageProps } from '@/lib/params'
import { payloadClient } from '@/lib/payload'

export const metadata = { title: 'Compare companies' }

type Score = { criterion: string; max: number; score: number }

export default async function Compare({ searchParams }: PageProps) {
  const sp = await searchParams
  const slugs = list(sp.ids).slice(0, 3)
  const payload = await payloadClient()
  const { docs } = slugs.length ? await payload.find({ collection: 'companies', where: { slug: { in: slugs } }, depth: 1, limit: 3 }) : { docs: [] }
  const companies = slugs.map((s) => docs.find((d) => d.slug === s)).filter((c): c is (typeof docs)[number] => Boolean(c))
  const licences = companies.length
    ? (await payload.find({ collection: 'licences', where: { company: { in: companies.map((c) => c.id) } }, depth: 1, limit: 100 })).docs
    : []
  const licFor = (id: number) => licences.filter((l) => (typeof l.company === 'object' ? l.company.id : l.company) === id)
  const criteria = [...new Set(companies.flatMap((c) => ((Array.isArray(c.ratingScores) ? c.ratingScores : []) as Score[]).map((s) => s.criterion)))]

  const rows: [string, (c: (typeof companies)[number]) => React.ReactNode][] = [
    ['BusinessLens Rating', (c) => <RatingBadge size="mini" state={c.ratingState} rating={c.ratingOverall} band={c.ratingBand} color={c.ratingColor} />],
    ['Community Score', (c) => <CommunityScore avg={c.reviewAverage} count={c.reviewCount} />],
    ...criteria.map((name) => [name, (c: (typeof companies)[number]) => {
      const s = ((Array.isArray(c.ratingScores) ? c.ratingScores : []) as Score[]).find((x) => x.criterion === name)
      return s && (c.ratingState === 'rated' || c.ratingState === 'under_review') ? `${s.score}/${s.max}` : '—'
    }] as [string, (c: (typeof companies)[number]) => React.ReactNode]),
    ['Category', (c) => (typeof c.primaryCategory === 'object' ? c.primaryCategory?.name : '—')],
    ['Headquarters', (c) => countryName(c.hqCountry) || '—'],
    ['Licences', (c) => licFor(c.id).map((l) => `${typeof l.regulator === 'object' ? l.regulator.code : ''} ${l.licenceNumber}${l.status && l.status !== 'Active' ? ` (${l.status})` : ''}`).join(', ') || 'None on record'],
    ['Founded', (c) => c.yearFounded ?? '—'],
    ['Min. deposit', (c) => (c.minDepositUsd != null ? `$${c.minDepositUsd.toLocaleString()}` : '—')],
    ['Platforms', (c) => c.platforms || '—'],
    ['Languages', (c) => c.languages || '—'],
    ['Website', (c) => (c.website ? <a href={c.website} target="_blank" rel="nofollow noopener noreferrer">{domainOf(c.website)} ↗</a> : '—')],
    ['Regulator alert', (c) => (c.alertActive ? <span className="chip danger">⚠ Active</span> : 'None')],
  ]

  return (
    <div className="wrap">
      <div className="page-head">
        <Crumbs items={[{ label: 'Home', href: '/' }, { label: 'Compare' }]} />
        <h1>Compare companies</h1>
        <p className="muted">Up to three side by side. Add companies with “+ Compare” on search results or profiles.</p>
      </div>
      {companies.length === 0 ? (
        <div className="card"><p style={{ margin: 0 }}>Nothing to compare yet. <Link href="/search">Find companies</Link> and click “+ Compare”.</p></div>
      ) : (
        <div className="table-wrap">
          <table className="cmp">
            <thead>
              <tr>
                <th />
                {companies.map((c) => (
                  <th key={c.id} scope="col">
                    <div className="row" style={{ flexWrap: 'nowrap' }}>
                      <Avatar name={c.legalName} initials={initials(c.legalName)} logoUrl={c.tier !== 'standard' ? c.logoUrl : null} size={40} />
                      <Link href={`/company/${c.slug}`}>{c.legalName}</Link>
                    </div>
                  </th>
                ))}
                {companies.length < 3 && <th scope="col"><Link href="/search" className="muted">+ add</Link></th>}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, cell]) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  {companies.map((c) => <td key={c.id}>{cell(c)}</td>)}
                  {companies.length < 3 && <td />}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="tiny muted" style={{ marginTop: 12 }}>Information only. Not investment advice.</p>
    </div>
  )
}
