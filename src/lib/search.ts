import { Meilisearch } from 'meilisearch'
import type { Payload } from 'payload'

import type { Company } from '@/payload-types'
import { domainOf, initials } from './format'

// Meilisearch powers search, filters and listing pages. Without it, pages fall back to the database.
export const INDEX = 'companies'

export function meili(): Meilisearch | null {
  const host = process.env.MEILI_HOST
  if (!host) return null
  return new Meilisearch({ host, apiKey: process.env.MEILI_API_KEY })
}

export type CompanyHit = {
  id: number
  slug: string
  name: string
  initials: string
  logoUrl?: string
  brands: string[]
  formerNames: string[]
  licenceNumbers: string[]
  lei?: string
  domain?: string
  category?: string
  categorySlug?: string
  subCategories: string[]
  subCategorySlugs: string[]
  country?: string
  countries: string[]
  regulators: string[]
  licences: { regulator: string; number: string; type?: string; status?: string }[]
  ratingState: string
  rating?: number
  ratingBand?: string
  ratingColor?: string
  ratedAt?: number
  reviewCount: number
  reviewAvg?: number
  hasReviews: boolean
  tier: string
  isPartner: boolean
  alert: boolean
  groupId?: string
  minDeposit?: number
  isExample: boolean
}

const SETTINGS = {
  searchableAttributes: ['name', 'brands', 'formerNames', 'licenceNumbers', 'lei', 'domain', 'regulators', 'subCategories', 'category'],
  filterableAttributes: [
    'categorySlug', 'subCategorySlugs', 'country', 'countries', 'regulators', 'ratingBand', 'ratingState',
    'isPartner', 'hasReviews', 'alert', 'groupId', 'tier', 'isExample', 'id', 'slug',
  ],
  sortableAttributes: ['rating', 'reviewCount', 'name', 'ratedAt', 'reviewAvg'],
  pagination: { maxTotalHits: 20000 },
  faceting: { maxValuesPerFacet: 200 },
}

const rel = <T,>(v: unknown): T | null => (v && typeof v === 'object' ? (v as T) : null)

export async function buildDocs(payload: Payload, companies: Company[]): Promise<CompanyHit[]> {
  if (!companies.length) return []
  const ids = companies.map((c) => c.id)
  const { docs: licences } = await payload.find({
    collection: 'licences',
    where: { company: { in: ids } },
    limit: 0,
    pagination: false,
    depth: 1,
  })
  return companies.map((c) => {
    const lic = licences.filter((l) => (typeof l.company === 'object' ? l.company?.id : l.company) === c.id)
    const cat = rel<{ name: string; slug: string }>(c.primaryCategory)
    const subs = (c.subCategories ?? []).map((s) => rel<{ name: string; slug: string }>(s)).filter(Boolean) as {
      name: string
      slug: string
    }[]
    const regs = lic.map((l) => rel<{ code: string }>(l.regulator)?.code).filter(Boolean) as string[]
    const countries = new Set<string>([c.hqCountry, ...(c.operatingCountries ?? []).map((o) => o.code), ...lic.map((l) => l.jurisdiction)].filter(Boolean) as string[])
    const rated = c.ratingState === 'rated' || (c.ratingState === 'under_review' && c.ratingOverall != null)
    return {
      id: c.id,
      slug: c.slug,
      name: c.legalName,
      initials: initials(c.legalName),
      logoUrl: c.tier !== 'standard' ? c.logoUrl || undefined : undefined,
      brands: (c.brandNames ?? []).map((b) => b.name),
      formerNames: (c.formerNames ?? []).map((b) => b.name),
      licenceNumbers: lic.map((l) => l.licenceNumber),
      lei: c.lei || undefined,
      domain: domainOf(c.website) || undefined,
      category: cat?.name,
      categorySlug: cat?.slug,
      subCategories: subs.map((s) => s.name),
      subCategorySlugs: subs.map((s) => s.slug),
      country: c.hqCountry || undefined,
      countries: [...countries],
      regulators: [...new Set(regs)],
      licences: lic.map((l) => ({
        regulator: rel<{ code: string }>(l.regulator)?.code ?? '',
        number: l.licenceNumber,
        type: l.licenceType || undefined,
        status: l.status || undefined,
      })),
      ratingState: c.ratingState || 'not_rated',
      ...(rated && c.ratingOverall != null
        ? {
            rating: c.ratingOverall,
            ratingBand: c.ratingBand || undefined,
            ratingColor: c.ratingColor || undefined,
            ratedAt: c.ratingDate ? new Date(c.ratingDate).getTime() : undefined,
          }
        : {}),
      reviewCount: c.reviewCount ?? 0,
      ...(c.reviewAverage ? { reviewAvg: c.reviewAverage } : {}),
      hasReviews: (c.reviewCount ?? 0) > 0,
      tier: c.tier || 'standard',
      isPartner: c.tier === 'partner',
      alert: Boolean(c.alertActive),
      groupId: c.groupId || undefined,
      minDeposit: c.minDepositUsd ?? undefined,
      isExample: Boolean(c.isExample),
    }
  })
}

export async function ensureIndex() {
  const client = meili()
  if (!client) return null
  const index = client.index<CompanyHit>(INDEX)
  await index.updateSettings(SETTINGS).waitTask({ timeout: 60000 })
  return index
}

export async function reindexCompanies(payload: Payload, ids?: number[]) {
  const client = meili()
  if (!client) return 0
  const index = await ensureIndex()
  if (!index) return 0
  let page = 1
  let total = 0
  for (;;) {
    const res = await payload.find({
      collection: 'companies',
      where: ids ? { id: { in: ids } } : {},
      limit: 250,
      page,
      depth: 1,
    })
    const docs = await buildDocs(payload, res.docs)
    if (docs.length) await index.addDocuments(docs, { primaryKey: 'id' }).waitTask({ timeout: 120000 })
    total += docs.length
    if (!res.hasNextPage) break
    page++
  }
  return total
}

export async function removeCompany(id: number) {
  const client = meili()
  if (!client) return
  await client.index(INDEX).deleteDocument(id).waitTask()
}

// Rebuilds the whole index from scratch (admin button and after imports).
export async function rebuildIndex(payload: Payload) {
  const client = meili()
  if (!client) return 0
  await client.index(INDEX).deleteAllDocuments().waitTask({ timeout: 60000 }).catch(() => undefined)
  return reindexCompanies(payload)
}
