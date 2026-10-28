import type React from 'react'
import Link from 'next/link'

import { Crumbs, JsonLd, Notice } from '@/components/site/CompanyList'
import { CompareButton } from '@/components/site/Compare'
import { ReviewItem, ReviewSortLinks } from '@/components/site/Reviews'
import { Avatar, CommunityScore, RatingBadge } from '@/components/site/Scores'
import { Turnstile } from '@/components/site/Turnstile'
import { getCompany, getProfileData, getReviews } from '@/lib/companyPage'
import { countryName } from '@/lib/countries'
import { domainOf, fmtDate, fmtMonth, initials, splitList } from '@/lib/format'
import type { SP } from '@/lib/params'
import { siteURL } from '@/lib/site'
import { turnstileSiteKey } from '@/lib/turnstile'
import { submitLead } from '../../actions'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SP> }
type Score = { criterion: string; max: number; score: number }

export async function generateMetadata({ params }: Props) {
  const c = await getCompany((await params).slug)
  const cat = typeof c.primaryCategory === 'object' ? c.primaryCategory?.name : ''
  return {
    title: `${c.legalName}: licences, rating and reviews`,
    description: `${c.legalName}${cat ? ` (${cat}, ${countryName(c.hqCountry)})` : ''}. Verified licences, BusinessLens Rating and client reviews.`,
  }
}

const barColor = (pct: number) => (pct >= 0.85 ? '#065f46' : pct >= 0.7 ? '#15803d' : pct >= 0.55 ? '#1d4ed8' : '#b45309')

function Section({ id, title, children, right }: { id: string; title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section id={id} className="card" style={{ scrollMarginTop: 130 }}>
      <div className="section-title" style={{ marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        {right}
      </div>
      {children}
    </section>
  )
}

export default async function CompanyPage({ params, searchParams }: Props) {
  const { slug } = await params
  const sp = await searchParams
  const c = await getCompany(slug)
  const d = await getProfileData(c)
  const rsort = sp.rsort ?? 'newest'
  const reviews = await getReviews(c.id, rsort, 1, 10)
  const partner = c.tier === 'partner'
  const claimed = c.tier !== 'standard'
  const scores = (Array.isArray(c.ratingScores) ? c.ratingScores : []) as Score[]
  const showScores = scores.length > 0 && (c.ratingState === 'rated' || c.ratingState === 'under_review')
  const activeLicence = d.licences.some((l) => l.status === 'Active')
  const brands = (c.brandNames ?? []).map((b) => b.name)
  const regCodes = [...new Set(d.licences.map((l) => l.reg?.code).filter(Boolean))] as string[]
  const countries = [...new Set([c.hqCountry, ...(c.operatingCountries ?? []).map((o) => o.code)].filter(Boolean))] as string[]
  const website = c.website ? (c.website.startsWith('http') ? c.website : `https://${c.website}`) : null
  const sources = [...regCodes.map((r) => `${r} register`), website ? 'company website' : null].filter(Boolean).join(', ')

  const tabs = partner
    ? [['overview', 'Overview'], ['products', 'Products & services'], ['rating', 'Rating'], ['reviews', 'Reviews'], ['team', 'Team'], ['licences', 'Licences'], ['offices', 'Offices'], ['news', 'News & documents']]
    : [['overview', 'Overview'], ['licences', 'Licences'], ['rating', 'Rating'], ['reviews', `Reviews (${c.reviewCount ?? 0})`], ['facts', 'Key facts']]

  const facts: [string, React.ReactNode][] = [
    ['Founded', c.yearFounded],
    ['Headquarters', c.hqCountry ? <Link href={`/country/${c.hqCountry.toLowerCase()}`}>{countryName(c.hqCountry)}</Link> : null],
    ['Operates in', countries.length > 1 ? countries.map(countryName).join(', ') : null],
    ['Website', website ? <a href={website} target="_blank" rel="nofollow noopener noreferrer">{domainOf(website)} ↗</a> : null],
    ['LEI', c.lei],
    ['Products', c.productsServices ? splitList(c.productsServices).join(', ') : null],
    ['Platforms', c.platforms ? splitList(c.platforms).join(', ') : null],
    ['Clients', c.clientTypes],
    ['Min. deposit', c.minDepositUsd != null ? `$${c.minDepositUsd.toLocaleString()}` : null],
    ['Languages', c.languages ? splitList(c.languages).join(', ') : null],
    ['Employees', c.employeeRange],
    ['Address', c.registeredAddress],
    ['Email', c.publicEmail],
    ['Phone', c.phone],
  ]
  const ratingNote = c.ratingState === 'suspended' ? c.ratingNote : null

  return (
    <div className="wrap">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: c.legalName,
          alternateName: brands.length ? brands : undefined,
          url: website ?? undefined,
          leiCode: c.lei ?? undefined,
          foundingDate: c.yearFounded ? String(c.yearFounded) : undefined,
          address: c.hqCountry ? { '@type': 'PostalAddress', addressCountry: c.hqCountry } : undefined,
          ...(c.reviewCount && c.reviewAverage ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: c.reviewAverage, reviewCount: c.reviewCount, bestRating: 5, worstRating: 1 } } : {}),
        }}
      />
      <div className="page-head" style={{ paddingBottom: 0 }}>
        <Crumbs
          items={[
            { label: 'Home', href: '/' },
            ...(d.cat ? [{ label: d.cat.name, href: `/category/${d.cat.slug}` }] : []),
            ...(d.subs[0] ? [{ label: d.subs[0].name, href: `/category/${d.subs[0].slug}` }] : []),
            ...(d.subs[0] && c.hqCountry ? [{ label: countryName(c.hqCountry), href: `/category/${d.subs[0].slug}/${c.hqCountry.toLowerCase()}` }] : []),
            { label: c.legalName },
          ]}
        />
        <Notice message={sp.message} error={sp.error} />
        {d.alerts.map((a) => (
          <div className="alert-banner" role="alert" key={a.id}>
            <span style={{ fontSize: 22 }}>⚠</span>
            <div>
              <strong>{a.title}</strong>
              <div className="small">
                {typeof a.regulator === 'object' && a.regulator ? `Listed on the ${a.regulator.code} warning list on ${fmtDate(a.date)}. ` : `${fmtDate(a.date)}. `}
                {a.summary}{' '}
                <Link href={`/alerts/${a.id}`}>Details</Link>
                {a.officialUrl && <> · <a href={a.officialUrl} target="_blank" rel="noopener noreferrer">View the official alert ↗</a></>}
              </div>
            </div>
          </div>
        ))}
        {partner && c.bannerUrl && <div className="banner" style={{ backgroundImage: `url(${c.bannerUrl})` }} role="img" aria-label={`${c.legalName} banner`} />}
      </div>

      <div className="profile-head" id="overview" style={{ marginTop: 18 }}>
        <Avatar name={c.legalName} initials={initials(c.legalName)} logoUrl={claimed ? c.logoUrl : null} size={72} />
        <div style={{ minWidth: 0 }}>
          <div className="row" style={{ gap: 10 }}>
            <h1 style={{ margin: 0 }}>{c.legalName}</h1>
            {partner && <span className="chip partner">BusinessLens Partner</span>}
          </div>
          <p className="muted" style={{ margin: '4px 0 8px' }}>
            {[brands.length ? `Trading as ${brands.join(', ')}` : null, d.cat?.name, d.subs.map((s) => s.name).join(', ') || null, (partner ? countries : [c.hqCountry]).filter(Boolean).map((x) => countryName(x)).join(', '), partner ? regCodes.join(', ') : null]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <div className="chips">
            {activeLicence && <span className="chip ok">✓ Licence verified</span>}
            {claimed ? <span className="chip ok">✓ Claimed{partner ? ' & verified' : ''}</span> : <span className="chip">Unclaimed profile</span>}
            {c.isExample && <span className="chip example">Example company (made up)</span>}
            {c.warningFlag && !c.isExample && <span className="chip warn">Under data review</span>}
          </div>
          {partner && (
            <div className="row" style={{ marginTop: 12 }}>
              {c.ctaUrl && <a className="btn" href={c.ctaUrl} target="_blank" rel="nofollow noopener noreferrer sponsored">{c.ctaLabel || 'Open an account'}</a>}
              {website && <a className="btn secondary" href={website} target="_blank" rel="nofollow noopener noreferrer">Visit website ↗</a>}
            </div>
          )}
        </div>
        <div className="scores">
          <RatingBadge state={c.ratingState} rating={c.ratingOverall} band={c.ratingBand} color={c.ratingColor} date={c.ratingDate} note={ratingNote} />
          <CommunityScore big avg={c.reviewAverage} count={c.reviewCount} />
          <CompareButton slug={c.slug} name={c.legalName} />
        </div>
      </div>

      <nav className="ptabs" aria-label="Sections">
        {tabs.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
      </nav>

      <div className="grid-2">
        <div className="stack" style={{ minWidth: 0, gap: 16 }}>
          <Section id="about" title="About">
            <p style={{ whiteSpace: 'pre-line' }}>{(partner && c.extendedAbout) || c.shortDescription || `${c.legalName} is listed on BusinessLens from official regulator registers.`}</p>
            {partner && c.videoUrl && (
              <div style={{ aspectRatio: '16 / 9', borderRadius: 12, overflow: 'hidden', background: '#000' }}>
                <iframe src={c.videoUrl} title={`${c.legalName} video`} style={{ width: '100%', height: '100%', border: 0 }} allowFullScreen loading="lazy" />
              </div>
            )}
            <p className="tiny muted" style={{ margin: 0 }}>{partner ? 'Supplied by the company and checked by BusinessLens.' : 'Written by BusinessLens from the regulator register and the company’s website.'}</p>
          </Section>

          {partner && (c.accounts || c.instruments || c.platformsDetail || c.fees) && (
            <Section id="products" title="Products & services">
              <dl className="facts" style={{ gridTemplateColumns: '120px minmax(0,1fr)' }}>
                {([['Accounts', c.accounts], ['Instruments', c.instruments], ['Platforms', c.platformsDetail], ['Fees', c.fees]] as const)
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k} style={{ display: 'contents' }}>
                      <dt>{k}</dt>
                      <dd style={{ whiteSpace: 'pre-line' }}>{v}</dd>
                    </div>
                  ))}
              </dl>
            </Section>
          )}

          <Section id="licences" title="Licences & regulation">
            {d.licences.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>No licence from a tracked regulator is on record for this company.</p>
            ) : (
              <div className="table-wrap">
                <table className="data">
                  <thead><tr><th>Regulator</th><th>Jurisdiction</th><th>Licence no.</th><th>Type</th><th>Status</th><th>Official register</th></tr></thead>
                  <tbody>
                    {d.licences.map((l) => (
                      <tr key={l.id}>
                        <td>{l.reg ? <Link href={`/regulator/${l.reg.slug}`}><strong>{l.reg.code}</strong></Link> : '—'}</td>
                        <td>{countryName(l.jurisdiction) || '—'}</td>
                        <td>{l.licenceNumber}</td>
                        <td className="small">{l.licenceType || '—'}</td>
                        <td><span className={`chip ${l.status === 'Active' ? 'ok' : l.status === 'Suspended' || l.status === 'Withdrawn' ? 'danger' : ''}`}>{l.status || 'Unknown'}</span></td>
                        <td>{l.registerUrl || l.reg?.registerUrl ? <a href={(l.registerUrl || l.reg?.registerUrl)!} target="_blank" rel="noopener noreferrer">View ↗</a> : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <Section id="rating" title={partner ? 'Rating & improvement journey' : 'Rating breakdown'} right={<Link className="small" href="/methodology">{c.ratingMethodology || "Methodology"} ›</Link>}>
            {showScores ? (
              <div className="stack">
                {scores.map((s) => {
                  const pct = s.max ? s.score / s.max : 0
                  return (
                    <div key={s.criterion}>
                      <div className="row between small"><span>{s.criterion}</span><strong>{s.score}/{s.max}</strong></div>
                      <div className="bar"><i style={{ width: `${pct * 100}%`, background: barColor(pct) }} /></div>
                    </div>
                  )
                })}
                {c.ratingState === 'under_review' && <p className="notice" style={{ background: 'var(--warn-soft)', color: 'var(--warn)', margin: 0 }}>Analysts are re-reviewing this company. The previous score stays visible until the new one is published.</p>}
              </div>
            ) : (
              <p className="muted" style={{ margin: 0 }}>
                {c.ratingState === 'suspended'
                  ? ratingNote || 'The rating is paused while we check information about this company.'
                  : 'BusinessLens analysts have not rated this company yet. Its licences and facts are still taken from official sources.'}
              </p>
            )}
            {d.history.length > 1 && (
              partner ? (
                <div style={{ marginTop: 18 }}>
                  <p className="small muted" style={{ marginBottom: 4 }}>Rating history · re-reviewed by BusinessLens analysts</p>
                  <div className="history" aria-label="Rating history">
                    {d.history.map((h) => (
                      <div className="pt" key={h.id}>
                        <strong style={{ color: 'var(--ink)' }}>{h.overall?.toFixed(1)}</strong>
                        <div className="col" style={{ height: `${(h.overall ?? 0) * 10}px`, background: h.bandColor || undefined }} />
                        <span>{fmtMonth(h.publishedAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="small muted" style={{ marginTop: 12, marginBottom: 0 }}>
                  History: {d.history.map((h) => `${h.overall?.toFixed(1)} (${fmtMonth(h.publishedAt)})`).join(' → ')}
                </p>
              )
            )}
            <p className="small" style={{ marginTop: 14, marginBottom: 0 }}>Is something wrong? <Link href={`/company/${slug}/rating-review`}>Request a rating review</Link></p>
          </Section>

          <Section
            id="reviews"
            title={`Community reviews (${c.reviewCount ?? 0})`}
            right={<Link className="btn small" href={`/review/new?company=${slug}`}>Write a review</Link>}
          >
            <p className="tiny muted">The Community Score comes only from approved user reviews and is never combined with the BusinessLens Rating. <Link href="/review-guidelines">Review guidelines</Link></p>
            {reviews.totalDocs > 1 && <ReviewSortLinks base={`/company/${slug}`} current={rsort} />}
            {reviews.docs.length === 0 && <p className="muted">No reviews yet. Be the first to share your experience.</p>}
            {reviews.docs.map((r) => <ReviewItem key={r.id} r={r} slug={slug} companyName={c.legalName} />)}
            {reviews.totalDocs > reviews.docs.length && <Link href={`/company/${slug}/reviews`}>All {reviews.totalDocs} reviews ›</Link>}
          </Section>

          {partner && !!c.team?.length && (
            <Section id="team" title="Leadership team">
              <div className="team">
                {c.team.map((t) => (
                  <div key={t.id ?? t.name} className="row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                    <Avatar name={t.name} initials={initials(t.name)} logoUrl={t.photoUrl} size={44} />
                    <div><strong>{t.name}</strong><div className="small muted">{t.role}</div><div className="tiny muted">{t.bio}</div></div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {partner && !!c.offices?.length && (
            <Section id="offices" title="Offices">
              {c.offices[0].lat != null && c.offices[0].lng != null && (
                <iframe
                  className="map"
                  title="Office map"
                  loading="lazy"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${c.offices[0].lng - 0.03},${c.offices[0].lat - 0.02},${c.offices[0].lng + 0.03},${c.offices[0].lat + 0.02}&layer=mapnik&marker=${c.offices[0].lat},${c.offices[0].lng}`}
                />
              )}
              <div className="tiles" style={{ marginTop: 12 }}>
                {c.offices.map((o) => (
                  <a key={o.id ?? o.city} className="tile" href={o.lat != null ? `https://www.openstreetmap.org/?mlat=${o.lat}&mlon=${o.lng}#map=15/${o.lat}/${o.lng}` : undefined} target="_blank" rel="noopener noreferrer">
                    <b>{o.city}</b><span>{o.address}{o.country ? `, ${countryName(o.country)}` : ''}</span>
                  </a>
                ))}
              </div>
            </Section>
          )}

          {partner && (
            <Section id="news" title="News, documents & badge">
              {!!c.news?.length && (
                <ul style={{ paddingInlineStart: 18 }}>
                  {c.news.map((n) => <li key={n.id ?? n.title}><strong>{n.title}</strong> <span className="tiny muted">{fmtDate(n.date)}</span><div className="small muted">{n.summary}</div></li>)}
                </ul>
              )}
              {!!c.documents?.length && (
                <div className="chips" style={{ marginBottom: 14 }}>
                  {c.documents.map((doc) => <a key={doc.id ?? doc.title} className="chip" href={doc.url} target="_blank" rel="noopener noreferrer">📄 {doc.title}</a>)}
                </div>
              )}
              <BadgeCode slug={slug} name={c.legalName} />
            </Section>
          )}
        </div>

        <aside className="stack" style={{ gap: 16 }}>
          {partner && (
            <div className="card" id="callback">
              <h3>Request a call back</h3>
              <p className="tiny muted">Sent to {c.legalName} and logged by BusinessLens. We never sell your details.</p>
              <form action={submitLead} className="form">
                <input type="hidden" name="type" value="callback" />
                <input type="hidden" name="company" value={c.id} />
                <input type="hidden" name="back" value={`/company/${slug}#callback`} />
                <label>Name<input name="name" required /></label>
                <label>Email or phone<input name="contact" required /></label>
                <label>Interest
                  <select name="interest">
                    <option>Opening an account</option>
                    <option>Professional or institutional services</option>
                    <option>Islamic account</option>
                    <option>Something else</option>
                  </select>
                </label>
                <label className="check"><input type="checkbox" name="consent" value="1" required /> I agree to be contacted by {c.legalName} about my request.</label>
                <Turnstile siteKey={turnstileSiteKey()} />
                <button className="btn">Send</button>
              </form>
            </div>
          )}

          <div className="card" id="facts">
            <h3>Key facts</h3>
            <dl className="facts">
              {facts.filter(([, v]) => v != null && v !== '').map(([k, v]) => (
                <div key={k} style={{ display: 'contents' }}><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
            {d.group.length > 0 && (
              <>
                <h4 style={{ margin: '16px 0 6px' }}>Group entities</h4>
                <ul style={{ paddingInlineStart: 18, margin: 0 }} className="small">
                  {d.group.map((g) => <li key={g.id}><Link href={`/company/${g.slug}`}>{g.legalName}</Link></li>)}
                </ul>
                {c.groupId && <Link className="small" href={`/group/${c.groupId.toLowerCase()}`}>See the whole group ›</Link>}
              </>
            )}
          </div>

          {claimed ? (
            <div className="card">
              <h3>Managed by the company</h3>
              <p className="small muted" style={{ margin: 0 }}>This company has claimed its profile and can suggest corrections and reply to reviews. BusinessLens approves every change. The rating is set only by our analysts.</p>
            </div>
          ) : (
            <div className="card">
              <h3>Is this your company?</h3>
              <p className="small muted">Claim it free to correct facts, reply to reviews and see your rating breakdown.</p>
              <Link className="btn secondary" href={`/company/${slug}/claim`}>Claim this profile</Link>
            </div>
          )}

          {!partner && (d.similar.length > 0 || d.featured) && (
            <div className="card">
              <h3>Similar companies</h3>
              <div className="stack" style={{ gap: 8 }}>
                {d.similar.map((h) => (
                  <Link key={h.id} href={`/company/${h.slug}`} className="row between" style={{ color: 'var(--ink)', flexWrap: 'nowrap' }}>
                    <span className="row" style={{ gap: 8, flexWrap: 'nowrap', minWidth: 0 }}><Avatar name={h.name} initials={h.initials} logoUrl={h.logoUrl} size={30} /><span className="small" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</span></span>
                    <RatingBadge size="mini" state={h.ratingState} rating={h.rating} band={null} color={h.ratingColor} />
                  </Link>
                ))}
              </div>
              {d.featured && (
                <Link href={`/company/${d.featured.slug}`} className="row between" style={{ color: 'var(--ink)', flexWrap: 'nowrap', marginTop: 10, padding: 8, borderRadius: 10, background: 'var(--featured-soft)' }}>
                  <span className="row" style={{ gap: 8, flexWrap: 'nowrap', minWidth: 0 }}>
                    <Avatar name={d.featured.name} initials={d.featured.initials} logoUrl={d.featured.logoUrl} size={30} />
                    <span style={{ minWidth: 0 }}>
                      <span className="small" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.featured.name}</span>
                      <span className="chip featured" style={{ fontSize: 11, padding: '1px 6px' }}>Featured</span>
                    </span>
                  </span>
                  <RatingBadge size="mini" state={d.featured.ratingState} rating={d.featured.rating} band={null} color={d.featured.ratingColor} />
                </Link>
              )}
            </div>
          )}
        </aside>
      </div>

      <div className="footer-strip">
        Data last verified {fmtDate(c.dateVerified || c.updatedAt)}{sources ? ` · Sources: ${sources}` : ''} · <Link href={`/company/${slug}/report`}>Report an error</Link>
        {partner && <> · <Link href={`/company/${slug}/rating-review`}>Request a rating review</Link></>} · Information only. Not investment advice. Not an endorsement.
      </div>

      <div className="pinned-actions">
        <Link className="btn secondary" href={`/review/new?company=${slug}`}>Write a review</Link>
        {website && <a className="btn" href={(partner && c.ctaUrl) || website} target="_blank" rel="nofollow noopener noreferrer">{partner && c.ctaLabel ? c.ctaLabel : 'Visit website'}</a>}
      </div>
      <div className="pinned-spacer" />
    </div>
  )
}

function BadgeCode({ slug, name }: { slug: string; name: string }) {
  const base = siteURL()
  const code = `<a href="${base}/company/${slug}"><img src="${base}/badge/${slug}" alt="${name} on BusinessLens" width="220" height="64"></a>`
  return (
    <div>
      <h4 style={{ margin: '0 0 6px' }}>Get our rating badge &lt;/&gt;</h4>
      <img src={`/badge/${slug}`} alt="BusinessLens rating badge" width={220} height={64} />
      <pre className="code">{code}</pre>
    </div>
  )
}
