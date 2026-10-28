import { cache } from 'react'

import type { Category, Regulator } from '@/payload-types'
import { payloadClient } from './payload'
import type { SearchParams } from 'meilisearch'

import { buildDocs, INDEX, meili, rebuildIndex, type CompanyHit } from './search'

// Shared data access for the public pages.

export const getCategories = cache(async () => {
  const payload = await payloadClient()
  const { docs } = await payload.find({ collection: 'categories', limit: 0, pagination: false, depth: 0, sort: 'order' })
  const mains = docs.filter((c) => !c.parent)
  const subsOf = (id: number) => docs.filter((c) => (typeof c.parent === 'object' ? c.parent?.id : c.parent) === id)
  return { all: docs, mains, subsOf, bySlug: new Map(docs.map((c) => [c.slug, c])) }
})

export const getRegulators = cache(async () => {
  const payload = await payloadClient()
  const { docs } = await payload.find({ collection: 'regulators', limit: 0, pagination: false, depth: 0, sort: 'order' })
  return { all: docs, byCode: new Map(docs.map((r) => [r.code, r])), bySlug: new Map(docs.map((r) => [r.slug, r])) }
})

export type Filters = {
  q?: string
  category?: string[]
  sub?: string[]
  country?: string[]
  regulator?: string[]
  band?: string[]
  state?: string[]
  partner?: boolean
  reviews?: boolean
  group?: string
}
export type Sort = 'rating' | 'reviews' | 'name' | 'recent' | 'relevance'

const quote = (v: string) => `"${v.replace(/"/g, '\\"')}"`
const anyOf = (field: string, values?: string[]) => (values?.length ? `(${values.map((v) => `${field} = ${quote(v)}`).join(' OR ')})` : null)

export function filterString(f: Filters) {
  return [
    anyOf('categorySlug', f.category),
    anyOf('subCategorySlugs', f.sub),
    anyOf('countries', f.country),
    anyOf('regulators', f.regulator),
    anyOf('ratingBand', f.band),
    anyOf('ratingState', f.state),
    f.partner ? 'isPartner = true' : null,
    f.reviews ? 'hasReviews = true' : null,
    f.group ? `groupId = ${quote(f.group)}` : null,
  ]
    .filter(Boolean)
    .join(' AND ')
}

const SORTS: Record<Sort, string[] | undefined> = {
  rating: ['rating:desc', 'reviewCount:desc'],
  reviews: ['reviewCount:desc', 'rating:desc'],
  name: ['name:asc'],
  recent: ['ratedAt:desc'],
  relevance: undefined,
}

export type FindResult = {
  hits: (CompanyHit & { matched?: string })[]
  total: number
  page: number
  pages: number
  facets: Record<string, Record<string, number>>
  ms: number
  engine: 'meilisearch' | 'database'
}

// Runs a Meilisearch query. If the index doesn't exist yet (fresh deploy), builds it from the database once and retries.
// Returns null when search is unavailable, so callers fall back to the database.
let rebuilding: Promise<unknown> | null = null
type SearchResult = {
  hits: CompanyHit[]
  totalHits?: number
  page?: number
  totalPages?: number
  facetDistribution?: Record<string, Record<string, number>>
  processingTimeMs: number
}
async function searchIndex(q: string, opts: SearchParams): Promise<SearchResult | null> {
  const client = meili()
  if (!client) return null
  const run = () => client.index<CompanyHit>(INDEX).search(q, opts) as unknown as Promise<SearchResult>
  try {
    return await run()
  } catch (err) {
    const code = (err as { cause?: { code?: string } }).cause?.code
    const payload = await payloadClient()
    if (code !== 'index_not_found') {
      payload.logger.error({ err, msg: 'Search failed, using the database' })
      return null
    }
    rebuilding ??= rebuildIndex(payload).finally(() => (rebuilding = null))
    try {
      await rebuilding
      return await run()
    } catch (err2) {
      payload.logger.error({ err: err2, msg: 'Search index rebuild failed, using the database' })
      return null
    }
  }
}

export async function findCompanies(f: Filters, sort: Sort = 'rating', page = 1, perPage = 25, facets: string[] = []): Promise<FindResult> {
  const started = Date.now()
  const found = await searchIndex(f.q || '', {
    filter: filterString(f) || undefined,
    sort: f.q && sort === 'relevance' ? undefined : SORTS[sort],
    page,
    hitsPerPage: perPage,
    facets,
    showMatchesPosition: Boolean(f.q),
  })
  if (found) {
    const hits = found.hits.map((h) => {
      const m = (h as unknown as { _matchesPosition?: Record<string, unknown> })._matchesPosition ?? {}
      const keys = Object.keys(m).map((k) => k.split('.')[0])
      let matched: string | undefined
      if (f.q && !keys.includes('name')) {
        if (keys.includes('brands')) matched = `brand "${h.brands.find((b) => b.toLowerCase().includes(f.q!.toLowerCase().slice(0, 3))) ?? h.brands[0]}"`
        else if (keys.includes('formerNames')) matched = 'former name'
        else if (keys.includes('licenceNumbers')) matched = 'licence number'
        else if (keys.includes('lei')) matched = 'LEI'
        else if (keys.includes('domain')) matched = `website ${h.domain}`
      }
      return { ...h, matched }
    })
    return {
      hits,
      total: found.totalHits ?? hits.length,
      page: found.page ?? 1,
      pages: found.totalPages ?? 1,
      facets: (found.facetDistribution as Record<string, Record<string, number>>) ?? {},
      ms: found.processingTimeMs,
      engine: 'meilisearch',
    }
  }
  // Database fallback (no Meilisearch): same filters, plain name matching, no typo tolerance or facets.
  const payload = await payloadClient()
  const slugs = [...(f.category ?? []), ...(f.sub ?? [])]
  const cats = slugs.length ? (await payload.find({ collection: 'categories', where: { slug: { in: slugs } }, depth: 0, limit: 100 })).docs : []
  const catIds = (list?: string[]) => cats.filter((c) => list?.includes(c.slug)).map((c) => c.id)
  let regCompanyIds: number[] | null = null
  if (f.regulator?.length) {
    const regs = await payload.find({ collection: 'regulators', where: { code: { in: f.regulator } }, depth: 0, limit: 50 })
    const lic = await payload.find({ collection: 'licences', where: { regulator: { in: regs.docs.map((r) => r.id) } }, depth: 0, limit: 0, pagination: false, select: { company: true } })
    regCompanyIds = [...new Set(lic.docs.map((l) => (typeof l.company === 'object' ? l.company.id : l.company)))]
  }
  const res = await payload.find({
    collection: 'companies',
    where: {
      and: [
        { archived: { not_equals: true } },
        f.q ? { or: [{ legalName: { like: f.q } }, { 'brandNames.name': { like: f.q } }, { lei: { equals: f.q.toUpperCase() } }] } : {},
        f.category?.length ? { primaryCategory: { in: catIds(f.category) } } : {},
        f.sub?.length ? { subCategories: { in: catIds(f.sub) } } : {},
        f.country?.length ? { hqCountry: { in: f.country } } : {},
        f.state?.length ? { ratingState: { in: f.state } } : {},
        f.band?.length ? { ratingBand: { in: f.band } } : {},
        f.partner ? { tier: { equals: 'partner' } } : {},
        f.reviews ? { reviewCount: { greater_than: 0 } } : {},
        f.group ? { groupId: { equals: f.group } } : {},
        regCompanyIds ? { id: { in: regCompanyIds.length ? regCompanyIds : [0] } } : {},
      ],
    },
    sort: sort === 'name' ? 'legalName' : sort === 'reviews' ? '-reviewCount' : sort === 'recent' ? '-ratingDate' : '-ratingOverall',
    page,
    limit: perPage,
    depth: 1,
  })
  const docs = await buildDocs(payload, res.docs)
  return {
    hits: docs,
    total: res.totalDocs,
    page: res.page ?? 1,
    pages: res.totalPages,
    facets: {},
    ms: Date.now() - started,
    engine: 'database',
  }
}

// Active paid slot for a placement, optionally limited to a category. Always shown labelled "Featured".
export async function featuredFor(placement: 'home' | 'search' | 'category' | 'similar', categorySlug?: string): Promise<CompanyHit | null> {
  const payload = await payloadClient()
  const now = new Date().toISOString()
  const { docs } = await payload.find({
    collection: 'featured-slots',
    where: { placement: { equals: placement }, active: { equals: true }, start: { less_than_equal: now }, end: { greater_than_equal: now } },
    depth: 1,
    limit: 10,
  })
  const slot = docs.find((d) => !d.category || (typeof d.category === 'object' && d.category.slug === categorySlug)) ?? null
  const company = slot && typeof slot.company === 'object' ? slot.company : null
  if (!company || company.tier !== 'partner') return null
  const client = meili()
  if (client) {
    const hit = await client.index<CompanyHit>(INDEX).getDocument(company.id).catch(() => null)
    if (hit) return hit
  }
  const [doc] = await buildDocs(payload, [company])
  return doc ?? null
}

export const regulatorName = (r: Regulator | number | null | undefined) => (r && typeof r === 'object' ? r.code : '')
export const categoryName = (c: Category | number | null | undefined) => (c && typeof c === 'object' ? c.name : '')

// Live counters for the homepage "trust numbers".
export const getCounts = cache(async () => {
  const payload = await payloadClient()
  const [companies, regulators, rated, reviews] = await Promise.all([
    payload.count({ collection: 'companies', where: { archived: { not_equals: true } } }),
    payload.count({ collection: 'regulators' }),
    payload.count({ collection: 'companies', where: { ratingState: { equals: 'rated' } } }),
    payload.count({ collection: 'reviews', where: { status: { equals: 'approved' } } }),
  ])
  let countries = 0
  let byCategory: Record<string, number> = {}
  const res = await searchIndex('', { limit: 0, facets: ['country', 'categorySlug'] })
  if (res) {
    countries = Object.keys(res.facetDistribution?.country ?? {}).length
    byCategory = res.facetDistribution?.categorySlug ?? {}
  }
  return { companies: companies.totalDocs, regulators: regulators.totalDocs, rated: rated.totalDocs, reviews: reviews.totalDocs, countries, byCategory }
})
