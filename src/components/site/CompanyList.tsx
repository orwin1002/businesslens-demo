import Link from 'next/link'

import { countryName } from '@/lib/countries'
import type { CompanyHit } from '@/lib/search'
import { CompareButton } from './Compare'
import { Avatar, CommunityScore, RatingBadge } from './Scores'

type Hit = CompanyHit & { matched?: string }

export function CompanyCard({ hit, featured = false, compare = true }: { hit: Hit; featured?: boolean; compare?: boolean }) {
  return (
    <div className={`ccard${featured ? ' featured' : ''}`}>
      <Avatar name={hit.name} initials={hit.initials} logoUrl={hit.logoUrl} />
      <div style={{ minWidth: 0 }}>
        <div className="row" style={{ gap: 8 }}>
          <Link className="name" href={`/company/${hit.slug}`}>{hit.name}</Link>
          {featured && <span className="chip featured">Featured</span>}
          {hit.isPartner && <span className="chip partner">Partner</span>}
          {hit.alert && <span className="chip danger">⚠ Regulator alert</span>}
          {hit.isExample && <span className="chip example">Example</span>}
        </div>
        <div className="meta">
          {[hit.category, hit.subCategories?.[0], hit.country && countryName(hit.country), hit.regulators?.join(', ')].filter(Boolean).join(' · ')}
          {hit.matched && <> · <em>matched {hit.matched}</em></>}
        </div>
      </div>
      <div className="scores">
        <RatingBadge size="mini" state={hit.ratingState} rating={hit.rating} band={hit.ratingBand} color={hit.ratingColor} />
        <CommunityScore avg={hit.reviewAvg} count={hit.reviewCount} />
        {compare && <CompareButton slug={hit.slug} name={hit.name} />}
      </div>
    </div>
  )
}

export function CompanyTable({ hits, featured, deposit = false, licenceFor }: { hits: Hit[]; featured?: Hit | null; deposit?: boolean; licenceFor?: string }) {
  const rows = featured ? [featured, ...hits.filter((h) => h.id !== featured.id)] : hits
  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>
            <th>Company</th>
            {licenceFor ? <th>Licence no.</th> : <th>Regulators</th>}
            <th>BusinessLens Rating</th>
            <th>Community</th>
            {deposit && <th>Min. deposit</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((h, i) => {
            const isFeatured = Boolean(featured && i === 0)
            const lic = licenceFor ? h.licences.find((l) => l.regulator === licenceFor) : null
            return (
              <tr key={`${h.id}-${i}`} className={isFeatured ? 'featured' : ''}>
                <td>
                  <div className="row" style={{ gap: 10, flexWrap: 'nowrap' }}>
                    <Avatar name={h.name} initials={h.initials} logoUrl={h.logoUrl} size={34} />
                    <div>
                      <Link href={`/company/${h.slug}`} style={{ fontWeight: 600, color: 'var(--ink)' }}>{h.name}</Link>
                      <div className="chips" style={{ marginTop: 2 }}>
                        {isFeatured && <span className="chip featured">Featured</span>}
                        {h.isPartner && <span className="chip partner">Partner</span>}
                        {h.alert && <span className="chip danger">⚠ Alert</span>}
                        {h.isExample && <span className="chip example">Example</span>}
                        <span className="tiny muted">{h.subCategories?.[0] ?? h.category}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="small">{lic ? <>{lic.number}<div className="tiny muted">{lic.type?.slice(0, 60)}</div></> : h.regulators.join(', ') || '—'}</td>
                <td><RatingBadge size="mini" state={h.ratingState} rating={h.rating} band={h.ratingBand} color={h.ratingColor} /></td>
                <td><CommunityScore avg={h.reviewAvg} count={h.reviewCount} /></td>
                {deposit && <td>{h.minDeposit != null ? `$${h.minDeposit.toLocaleString()}` : '—'}</td>}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function Pager({ page, pages, href }: { page: number; pages: number; href: (p: number) => string }) {
  if (pages <= 1) return null
  const nums = [...new Set([1, page - 2, page - 1, page, page + 1, page + 2, pages])].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b)
  return (
    <nav className="pager" aria-label="Pages">
      {page > 1 && <Link href={href(page - 1)}>‹ Previous</Link>}
      {nums.map((p, i) => (
        <span key={p} style={{ display: 'contents' }}>
          {i > 0 && p - nums[i - 1] > 1 && <span>…</span>}
          {p === page ? <span className="on">{p}</span> : <Link href={href(p)}>{p}</Link>}
        </span>
      ))}
      {page < pages && <Link href={href(page + 1)}>Next ›</Link>}
    </nav>
  )
}

export function Crumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        {items.map((it, i) => (
          <span key={i}>
            {i > 0 && '› '}
            {it.href ? <Link href={it.href}>{it.label}</Link> : it.label}
          </span>
        ))}
      </nav>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.label, ...(it.href ? { item: it.href } : {}) })),
        }}
      />
    </>
  )
}

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
}

export function Notice({ message, error }: { message?: string; error?: string }) {
  return (
    <>
      {message && <p className="notice ok" role="status">{message}</p>}
      {error && <p className="notice err" role="alert">{error}</p>}
    </>
  )
}
