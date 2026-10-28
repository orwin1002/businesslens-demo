import Link from 'next/link'

import { CompanyCard, Pager } from '@/components/site/CompanyList'
import { countryName } from '@/lib/countries'
import { featuredFor, findCompanies, getCategories, type Filters, type Sort } from '@/lib/directory'
import { list, toggle, withParams, type PageProps, type SP } from '@/lib/params'

export const metadata = { title: 'Search companies' }

const BANDS = ['Top tier', 'Strong', 'Established', 'Developing']
const STATES: Record<string, string> = { rated: 'Rated', not_rated: 'Not yet rated', under_review: 'Under review', suspended: 'Rating suspended' }
const SORT_LABELS: Record<Sort, string> = { relevance: 'Best match', rating: 'Rating', reviews: 'Most reviews', name: 'Name A–Z', recent: 'Recently rated' }

function FilterGroup({ title, param, sp, options }: { title: string; param: string; sp: SP; options: { value: string; label: string; count?: number }[] }) {
  if (!options.length) return null
  const on = list(sp[param])
  return (
    <fieldset className="fgroup">
      <legend>{title}</legend>
      {options.map((o) => (
        <Link key={o.value} href={withParams('/search', sp, { [param]: toggle(sp[param], o.value), page: undefined })} className={`fopt${on.includes(o.value) ? ' on' : ''}`} rel="nofollow">
          <span className="box" aria-hidden="true">{on.includes(o.value) ? '✓' : ''}</span>
          {o.label}
          {o.count != null && <span className="muted"> ({o.count})</span>}
        </Link>
      ))}
    </fieldset>
  )
}

export default async function Search({ searchParams }: PageProps) {
  const sp = await searchParams
  const cats = await getCategories()
  const f: Filters = {
    q: sp.q?.trim() || undefined,
    category: list(sp.category),
    sub: list(sp.sub),
    country: list(sp.country),
    regulator: list(sp.regulator),
    band: list(sp.band),
    state: list(sp.state),
    partner: sp.partner === '1',
    reviews: sp.reviews === '1',
  }
  const sort = (sp.sort && sp.sort in SORT_LABELS ? sp.sort : f.q ? 'relevance' : 'rating') as Sort
  const page = Math.max(1, Number(sp.page) || 1)
  const [res, featured] = await Promise.all([
    findCompanies(f, sort, page, 20, ['categorySlug', 'subCategorySlugs', 'countries', 'regulators', 'ratingBand', 'ratingState']),
    featuredFor('search'),
  ])
  // One Featured slot at most, and only when that company fits what the visitor searched for.
  const showFeatured =
    featured && page === 1 &&
    (f.q
      ? res.hits.some((h) => h.id === featured.id)
      : (!f.category?.length || f.category.includes(featured.categorySlug ?? '')) && (!f.country?.length || featured.countries.some((c) => f.country!.includes(c))))
  const fc = res.facets
  const facetOpts = (key: string, label: (v: string) => string, limit = 12) =>
    Object.entries(fc[key] ?? {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([value, count]) => ({ value, label: label(value), count }))
  const catName = (slug: string) => cats.bySlug.get(slug)?.name ?? slug
  const selectedMains = (f.category ?? []).map((s) => cats.bySlug.get(s)).filter(Boolean)
  const subOptions = selectedMains.flatMap((m) => cats.subsOf(m!.id)).map((s) => ({ value: s.slug, label: s.name, count: fc.subCategorySlugs?.[s.slug] ?? 0 })).filter((o) => o.count > 0 || f.sub?.includes(o.value))

  // Active filters as removable chips.
  const chips: { label: string; href: string }[] = []
  for (const [param, label] of [['category', catName], ['sub', catName], ['country', countryName], ['regulator', (v: string) => v], ['band', (v: string) => v], ['state', (v: string) => STATES[v] ?? v]] as const)
    for (const v of list(sp[param])) chips.push({ label: label(v), href: withParams('/search', sp, { [param]: toggle(sp[param], v), page: undefined }) })
  if (f.partner) chips.push({ label: 'Partners only', href: withParams('/search', sp, { partner: undefined }) })
  if (f.reviews) chips.push({ label: 'Has reviews', href: withParams('/search', sp, { reviews: undefined }) })

  return (
    <div className="wrap section">
      <div className="grid-side">
        <details className="filters" open>
          <summary className="btn secondary">Filters{chips.length ? ` (${chips.length})` : ''}</summary>
          <aside className="card" aria-label="Filters">
            <FilterGroup title="Category" param="category" sp={sp} options={facetOpts('categorySlug', catName)} />
            <FilterGroup title="Sub-category" param="sub" sp={sp} options={subOptions} />
            <FilterGroup title="Country" param="country" sp={sp} options={facetOpts('countries', countryName, 10)} />
            <FilterGroup title="Regulator" param="regulator" sp={sp} options={facetOpts('regulators', (v) => v, 15)} />
            <FilterGroup title="Rating band" param="band" sp={sp} options={BANDS.map((b) => ({ value: b, label: b, count: fc.ratingBand?.[b] ?? 0 }))} />
            <FilterGroup title="Rating state" param="state" sp={sp} options={Object.entries(STATES).map(([value, label]) => ({ value, label, count: fc.ratingState?.[value] ?? 0 })).filter((o) => o.count || list(sp.state).includes(o.value))} />
            <fieldset className="fgroup">
              <legend>More</legend>
              <Link className={`fopt${f.partner ? ' on' : ''}`} href={withParams('/search', sp, { partner: f.partner ? undefined : '1', page: undefined })} rel="nofollow"><span className="box">{f.partner ? '✓' : ''}</span>Partners only</Link>
              <Link className={`fopt${f.reviews ? ' on' : ''}`} href={withParams('/search', sp, { reviews: f.reviews ? undefined : '1', page: undefined })} rel="nofollow"><span className="box">{f.reviews ? '✓' : ''}</span>Has reviews</Link>
            </fieldset>
          </aside>
        </details>

        <div style={{ minWidth: 0 }}>
          <form action="/search" className="row" style={{ marginBottom: 14, flexWrap: 'nowrap' }} role="search">
            {Object.entries(sp).filter(([k, v]) => v && !['q', 'page'].includes(k)).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
            <input name="q" defaultValue={f.q ?? ''} placeholder="Company, brand, licence number or LEI" aria-label="Search" />
            <button className="btn">Search</button>
          </form>
          <div className="row between" style={{ marginBottom: 12 }}>
            <div>
              <strong>{res.total.toLocaleString()} result{res.total === 1 ? '' : 's'}</strong>
              {f.q && <> for “{f.q}”</>}
              <span className="tiny muted"> · {res.ms} ms{res.engine === 'database' ? ' · basic search (Meilisearch not connected)' : ''}</span>
            </div>
            <div className="row small" style={{ gap: 6 }}>
              <span className="muted">Sort:</span>
              {(Object.keys(SORT_LABELS) as Sort[]).filter((s) => s !== 'relevance' || f.q).map((s) => (
                <Link key={s} rel="nofollow" className={`chip${s === sort ? ' partner' : ''}`} href={withParams('/search', sp, { sort: s, page: undefined })}>{SORT_LABELS[s]}</Link>
              ))}
            </div>
          </div>
          {chips.length > 0 && (
            <div className="chips" style={{ marginBottom: 12 }}>
              {chips.map((c) => <Link key={c.href + c.label} className="chip" href={c.href} rel="nofollow">{c.label} ✕</Link>)}
              <Link className="small" href={withParams('/search', {}, { q: f.q })}>Clear all</Link>
            </div>
          )}
          {showFeatured && <CompanyCard hit={featured!} featured />}
          {res.hits.length === 0 && (
            <div className="card">
              <p><strong>No companies match.</strong></p>
              <p className="muted small" style={{ margin: 0 }}>Try fewer filters, or search by brand, licence number or LEI. If a company is missing, <Link href="/contact">tell us</Link>.</p>
            </div>
          )}
          {res.hits.map((h) => <CompanyCard key={h.id} hit={h} />)}
          <Pager page={res.page} pages={res.pages} href={(p) => withParams('/search', sp, { page: String(p) })} />
          <p className="tiny muted">Ranking is never changed by payment. A “Featured” slot is a paid placement and always labelled.</p>
        </div>
      </div>
    </div>
  )
}
