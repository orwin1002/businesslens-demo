import Link from 'next/link'

import { CompanyCard, JsonLd } from '@/components/site/CompanyList'
import { Stars } from '@/components/site/Scores'
import { SearchBox } from '@/components/site/SearchBox'
import { COUNTRIES, countryName, GCC } from '@/lib/countries'
import { featuredFor, findCompanies, getCategories, getCounts, getRegulators } from '@/lib/directory'
import { fmtDate, fmtMonth } from '@/lib/format'
import type { PageProps } from '@/lib/params'
import { payloadClient } from '@/lib/payload'
import { DEFAULT_CRITERIA } from '@/lib/rating'
import { siteURL } from '@/lib/site'
import { subscribe } from './actions'

export default async function Home({ searchParams }: PageProps) {
  const sp = await searchParams
  const payload = await payloadClient()
  const [home, counts, { mains }, { all: regulators }] = await Promise.all([
    payload.findGlobal({ slug: 'home' }),
    getCounts(),
    getCategories(),
    getRegulators(),
  ])
  const topCat = sp.top && mains.some((m) => m.slug === sp.top) ? sp.top : ''
  const [top, featured, alerts, reviews, insights, methodology] = await Promise.all([
    findCompanies({ category: topCat ? [topCat] : undefined, state: ['rated'] }, 'rating', 1, 4),
    featuredFor('home'),
    payload.find({ collection: 'alerts', where: { active: { equals: true } }, sort: '-date', limit: 4, depth: 1 }),
    payload.find({ collection: 'reviews', where: { status: { equals: 'approved' } }, sort: '-createdAt', limit: 3, depth: 1 }),
    payload.find({ collection: 'insights', where: { publishedAt: { exists: true } }, sort: '-publishedAt', limit: 3, depth: 0 }),
    payload.find({ collection: 'methodologies', where: { isDefault: { equals: true } }, limit: 1, depth: 0 }),
  ])
  const criteria = methodology.docs[0]?.criteria?.length ? methodology.docs[0].criteria : DEFAULT_CRITERIA
  const topList = featured ? [...top.hits.filter((h) => h.id !== featured.id).slice(0, 3)] : top.hits

  const stats = [
    [counts.companies, 'institutions listed'],
    [counts.regulators, 'regulators tracked'],
    [counts.countries, 'countries'],
    [counts.rated, 'expert ratings'],
    [counts.reviews, 'verified reviews'],
  ].filter(([n]) => Number(n) > 0) as [number, string][]

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'BusinessLens',
          url: siteURL(),
          potentialAction: { '@type': 'SearchAction', target: `${siteURL()}/search?q={query}`, 'query-input': 'required name=query' },
        }}
      />
      {/* 1. Hero and search */}
      <section className="hero">
        <div className="wrap">
          <h1>{home.headline}</h1>
          <p className="lead">{home.subline}</p>
          <SearchBox
            hero
            categories={mains.filter((m) => !m.laterPhase).map((m) => ({ value: m.slug, label: m.name }))}
            countries={Object.keys(COUNTRIES)
              .filter((c) => GCC.includes(c) || ['GB', 'CY', 'SG', 'VG'].includes(c))
              .map((c) => ({ value: c, label: countryName(c) }))}
          />
          {!!home.popularSearches?.length && (
            <div className="popular">
              <span>Popular:</span>
              {home.popularSearches.map((p) => (
                <Link key={p.href} className="chip" href={p.href}>{p.label}</Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="wrap">
        {/* 2. Live counters (zeros hidden) */}
        <section className="section" style={{ paddingBottom: 8 }}>
          <div className="stats">
            {stats.map(([n, label]) => (
              <div className="stat" key={label}><b>{n.toLocaleString()}</b><span>{label}</span></div>
            ))}
          </div>
        </section>

        {/* 3. Categories */}
        <section className="section">
          <div className="section-title"><h2>Browse by category</h2><Link href="/search">All companies ›</Link></div>
          <div className="tiles">
            {mains.filter((m) => !m.laterPhase).map((m) => (
              <Link className="tile" key={m.id} href={`/category/${m.slug}`}>
                <b>{m.name}</b>
                <span>{(counts.byCategory[m.slug] ?? 0).toLocaleString()} listed</span>
              </Link>
            ))}
          </div>
        </section>

        {/* 4. Top rated */}
        <section className="section" id="top">
          <div className="section-title">
            <h2>Top rated</h2>
            <nav className="tabs-inline" aria-label="Top rated by category">
              <Link className={!topCat ? 'on' : ''} href="/#top" scroll={false}>All</Link>
              {mains.filter((m) => !m.laterPhase).slice(0, 5).map((m) => (
                <Link key={m.slug} className={topCat === m.slug ? 'on' : ''} href={`/?top=${m.slug}#top`} scroll={false}>{m.name.split(' ')[0]}</Link>
              ))}
            </nav>
          </div>
          {topList.length === 0 && !featured && <p className="muted">No rated companies in this category yet.</p>}
          {featured && <CompanyCard hit={featured} featured />}
          {topList.map((h) => <CompanyCard key={h.id} hit={h} />)}
          <p className="tiny muted" style={{ marginTop: 10 }}>Ranked by BusinessLens Rating. A “Featured” slot is a paid placement and never changes the ranking.</p>
        </section>

        {/* 5. Regulators and warnings */}
        <section className="section grid-2">
          <div>
            <div className="section-title"><h2>Regulators</h2><Link href="/regulators">All regulators ›</Link></div>
            <div className="chips">
              {regulators.map((r) => (
                <Link key={r.id} className="chip" style={{ fontSize: 14, padding: '6px 12px' }} href={`/regulator/${r.slug}`}>{r.code}</Link>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="section-title"><h3 style={{ margin: 0 }}>Latest regulator warnings</h3><Link className="small" href="/alerts">All ›</Link></div>
            {alerts.docs.length === 0 && <p className="muted small">No active warnings.</p>}
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
              {alerts.docs.map((a) => (
                <li key={a.id} className="small">
                  <span className="chip danger">⚠ {typeof a.regulator === 'object' ? a.regulator?.code : 'Notice'}</span>{' '}
                  <Link href={`/alerts/${a.id}`}>{a.title}</Link>
                  <div className="tiny muted">{fmtDate(a.date)}</div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 6. How the rating works */}
        <section className="section">
          <div className="section-title"><h2>How the rating works</h2><Link href="/methodology">Read the methodology ›</Link></div>
          <p className="muted" style={{ maxWidth: 760 }}>
            Analysts score every company on five criteria from verified sources. The total becomes a score out of 10. Paying for a profile never changes a score.
          </p>
          <div className="criteria">
            {criteria.map((c) => (
              <div className="c" key={c.name}>
                <b>{c.name}</b>
                <span className="small muted">{c.maxPoints} points</span>
                <div className="bar" style={{ marginTop: 8 }}><i style={{ width: `${c.maxPoints * 3.33}%`, background: 'var(--brand-2)' }} /></div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. Recent reviews and compare */}
        <section className="section grid-2">
          <div>
            <div className="section-title"><h2>Recent reviews</h2><Link href="/review/new">Write a review ›</Link></div>
            <div className="stack">
              {reviews.docs.map((r) => {
                const c = typeof r.company === 'object' ? r.company : null
                return (
                  <div className="card" key={r.id} style={{ marginTop: 0 }}>
                    <div className="row between">
                      <Stars value={r.rating} />
                      <span className="tiny muted">{fmtMonth(r.experienceDate || r.createdAt)}</span>
                    </div>
                    <strong>{r.title}</strong>
                    <p className="small muted" style={{ margin: '4px 0' }}>{r.body.slice(0, 160)}{r.body.length > 160 ? '…' : ''}</p>
                    {c && <Link className="small" href={`/company/${c.slug}#reviews`}>{c.legalName} ›</Link>}
                  </div>
                )
              })}
            </div>
          </div>
          <div className="card">
            <h3>Compare up to 3</h3>
            <p className="small muted">Click “+ Compare” on any company to put it side by side with others: rating, licences, reviews and key facts.</p>
            <div className="stack">
              {[1, 2, 3].map((i) => (
                <Link key={i} href="/search" className="tile" style={{ borderStyle: 'dashed', textAlign: 'center' }}><span>+ add a company</span></Link>
              ))}
            </div>
          </div>
        </section>

        {/* 8. For institutions */}
        <section className="section">
          <div className="cta-band">
            <div>
              <h2>{home.institutionsTitle}</h2>
              <p style={{ margin: 0 }}>{home.institutionsText}</p>
            </div>
            <div className="row">
              <Link className="btn secondary" href="/business">Claim your profile</Link>
              <Link className="btn accent" href="/business#talk">Talk to us</Link>
            </div>
          </div>
        </section>

        {/* 9. Insights and newsletter */}
        <section className="section grid-2">
          <div>
            <div className="section-title"><h2>Insights</h2><Link href="/insights">All insights ›</Link></div>
            <div className="tiles" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
              {insights.docs.map((a) => (
                <Link className="tile" key={a.id} href={`/insights/${a.slug}`}>
                  <span className="tiny">{fmtDate(a.publishedAt)}</span>
                  <b>{a.title}</b>
                  <span>{a.excerpt?.slice(0, 110)}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="card" id="newsletter">
            <h3>Newsletter</h3>
            <p className="small muted">New ratings, regulator warnings and research, once a month.</p>
            {sp.message && <p className="notice ok">{sp.message}</p>}
            <form action={subscribe} className="form">
              <input type="hidden" name="back" value="/#newsletter" />
              <label className="sr-only" htmlFor="nl-email">Email</label>
              <input id="nl-email" name="email" type="email" placeholder="you@example.com" required />
              <button className="btn">Subscribe</button>
            </form>
          </div>
        </section>
      </div>
    </>
  )
}
