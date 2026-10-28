import Link from 'next/link'
import React from 'react'

import { countryName } from '@/lib/countries'
import { featuredFor, findCompanies, getCategories, getRegulators, type Filters, type Sort } from '@/lib/directory'
import { fmtDate, fmtMonth } from '@/lib/format'
import { withParams, type SP } from '@/lib/params'
import { payloadClient } from '@/lib/payload'
import { CompanyTable, Crumbs, JsonLd, Pager } from './CompanyList'

const SORTS: Record<string, string> = { rating: 'Rating', reviews: 'Reviews', name: 'Name', recent: 'Recently rated' }

// One template for category, category × country, country, regulator and group pages.
export async function Listing({
  path,
  sp,
  title,
  crumbs,
  intro,
  base,
  featuredCategory,
  deposit = false,
  licenceFor,
  otherCountries,
  head,
  aside,
  quickFilter = 'regulator',
}: {
  path: string
  sp: SP
  title: string
  crumbs: { label: string; href?: string }[]
  intro?: React.ReactNode
  base: Filters
  featuredCategory?: string
  deposit?: boolean
  licenceFor?: string
  otherCountries?: { href: string; label: string }[]
  head?: React.ReactNode
  aside?: React.ReactNode
  quickFilter?: 'regulator' | 'category'
}) {
  const sort = (sp.sort && sp.sort in SORTS ? sp.sort : 'rating') as Sort
  const page = Math.max(1, Number(sp.page) || 1)
  const quick = sp.q2
  const filters: Filters = {
    ...base,
    ...(quick ? (quickFilter === 'regulator' ? { regulator: [quick] } : { category: [quick] }) : {}),
  }
  const [all, res, featured, regs, cats] = await Promise.all([
    findCompanies(base, 'rating', 1, 1, ['regulators', 'ratingState', 'categorySlug']),
    findCompanies(filters, sort, page, 25),
    featuredCategory !== undefined ? featuredFor('category', featuredCategory || undefined) : Promise.resolve(null),
    getRegulators(),
    getCategories(),
  ])
  const rated = all.facets.ratingState?.rated ?? 0
  const quickOpts =
    quickFilter === 'regulator'
      ? Object.entries(all.facets.regulators ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 10)
      : Object.entries(all.facets.categorySlug ?? {}).sort((a, b) => b[1] - a[1])
  const payload = await payloadClient()
  const regIds = Object.keys(all.facets.regulators ?? {}).map((c) => regs.byCode.get(c)?.id).filter(Boolean) as number[]
  const alerts = regIds.length
    ? await payload.find({ collection: 'alerts', where: { active: { equals: true }, regulator: { in: regIds } }, sort: '-date', limit: 3, depth: 0 })
    : { docs: [] }
  const showFeatured = featured && page === 1 && !quick && (!base.country?.length || featured.countries.some((c) => base.country!.includes(c)))

  return (
    <div className="wrap">
      <div className="page-head">
        <Crumbs items={crumbs} />
        <h1>{title}</h1>
        <p className="muted">
          {all.total.toLocaleString()} {all.total === 1 ? 'company' : 'companies'} · {rated} rated · register data checked {fmtMonth(new Date())}
        </p>
        {head}
        {quickOpts.length > 1 && (
          <nav className="tabs-inline" aria-label="Quick filters" style={{ marginTop: 12 }}>
            <span className="small muted" style={{ alignSelf: 'center' }}>{quickFilter === 'regulator' ? 'Licensed by:' : 'By category:'}</span>
            <Link className={!quick ? 'on' : ''} href={withParams(path, sp, { q2: undefined, page: undefined })}>All</Link>
            {quickOpts.map(([v, n]) => (
              <Link key={v} className={quick === v ? 'on' : ''} href={withParams(path, sp, { q2: v, page: undefined })}>
                {quickFilter === 'regulator' ? v : cats.bySlug.get(v)?.name ?? v} ({n})
              </Link>
            ))}
          </nav>
        )}
        {otherCountries && otherCountries.length > 0 && (
          <p className="small" style={{ marginTop: 10 }}>
            <span className="muted">Other countries: </span>
            {otherCountries.map((o, i) => (
              <span key={o.href}>{i > 0 && ' · '}<Link href={o.href}>{o.label}</Link></span>
            ))}
          </p>
        )}
      </div>
      <div className="grid-2">
        <div style={{ minWidth: 0 }}>
          <div className="row between" style={{ margin: '6px 0 12px' }}>
            <strong>{res.total.toLocaleString()} shown</strong>
            <div className="row small" style={{ gap: 6 }}>
              <span className="muted">Sort:</span>
              {Object.entries(SORTS).map(([s, label]) => (
                <Link key={s} rel="nofollow" className={`chip${s === sort ? ' partner' : ''}`} href={withParams(path, sp, { sort: s, page: undefined })}>{label}</Link>
              ))}
              <Link className="small" href={withParams('/search', {}, { category: base.category?.join(','), sub: base.sub?.join(','), country: base.country?.join(','), regulator: base.regulator?.join(',') })}>More filters ›</Link>
            </div>
          </div>
          {res.hits.length === 0 ? (
            <div className="card"><p className="muted" style={{ margin: 0 }}>No companies listed here yet.</p></div>
          ) : (
            <CompanyTable hits={res.hits} featured={showFeatured ? featured : null} deposit={deposit} licenceFor={licenceFor} />
          )}
          <Pager page={res.page} pages={res.pages} href={(p) => withParams(path, sp, { page: String(p) })} />
          <p className="tiny muted">
            Information only. Not investment advice. Ranked by BusinessLens Rating; “Featured” slots are paid and labelled. <Link href="/methodology">Methodology ›</Link>
          </p>
        </div>
        <aside className="stack">
          {intro && <div className="card">{intro}</div>}
          {Object.keys(all.facets.regulators ?? {}).length > 0 && !licenceFor && (
            <div className="card">
              <h3>Regulators here</h3>
              <div className="chips">
                {Object.keys(all.facets.regulators).map((code) => {
                  const r = regs.byCode.get(code)
                  return r ? <Link key={code} className="chip" href={`/regulator/${r.slug}`}>{code}</Link> : <span key={code} className="chip">{code}</span>
                })}
              </div>
            </div>
          )}
          {alerts.docs.length > 0 && (
            <div className="card">
              <h3>Recent alerts</h3>
              <ul style={{ paddingInlineStart: 18, margin: 0 }} className="small">
                {alerts.docs.map((a) => <li key={a.id}><Link href={`/alerts/${a.id}`}>{a.title}</Link> <span className="muted">{fmtDate(a.date)}</span></li>)}
              </ul>
            </div>
          )}
          {aside}
          <div className="card qa">
            <h3>Questions</h3>
            <details><summary>How do I check a company’s licence?</summary><p className="small">Open the company and use the “Official register” link next to each licence. It goes straight to the regulator’s own record.</p></details>
            <details><summary>What does “Not yet rated” mean?</summary><p className="small">Our analysts have not scored this company yet. Its licences and facts are still taken from official sources.</p></details>
            <details><summary>Can a company pay for a better rating?</summary><p className="small">No. Ratings are set only by analysts using the published <Link href="/methodology">methodology</Link>. Paid placements are always labelled “Featured”.</p></details>
          </div>
        </aside>
      </div>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: title,
          numberOfItems: res.total,
          itemListElement: res.hits.slice(0, 10).map((h, i) => ({ '@type': 'ListItem', position: i + 1, name: h.name, url: `/company/${h.slug}` })),
        }}
      />
    </div>
  )
}

export const countryLinks = (facet: Record<string, number> | undefined, exclude: string, href: (code: string) => string) =>
  Object.entries(facet ?? {})
    .filter(([c]) => c.toLowerCase() !== exclude.toLowerCase())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([c]) => ({ href: href(c.toLowerCase()), label: countryName(c) }))
