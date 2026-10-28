import { notFound } from 'next/navigation.js'
import type { Sort as PayloadSort } from 'payload'
import { cache } from 'react'

import type { Category, Company, Regulator } from '@/payload-types'
import { featuredFor, findCompanies } from './directory'
import { payloadClient } from './payload'

export const getCompany = cache(async (slug: string) => {
  const payload = await payloadClient()
  const { docs } = await payload.find({ collection: 'companies', where: { slug: { equals: slug }, archived: { not_equals: true } }, limit: 1, depth: 1 })
  if (!docs[0]) notFound()
  return docs[0]
})

export const REVIEW_SORTS: Record<string, { label: string; sort: PayloadSort }> = {
  newest: { label: 'Newest', sort: '-createdAt' },
  helpful: { label: 'Most helpful', sort: '-helpfulCount' },
  highest: { label: 'Highest', sort: '-rating' },
  lowest: { label: 'Lowest', sort: 'rating' },
}

export async function getReviews(companyId: number, sortKey = 'newest', page = 1, limit = 10) {
  const payload = await payloadClient()
  return payload.find({
    collection: 'reviews',
    where: { company: { equals: companyId }, status: { equals: 'approved' } },
    sort: (REVIEW_SORTS[sortKey] ?? REVIEW_SORTS.newest).sort,
    page,
    limit,
    depth: 0,
  })
}

export async function getProfileData(company: Company) {
  const payload = await payloadClient()
  const cat = typeof company.primaryCategory === 'object' ? (company.primaryCategory as Category | null) : null
  const subs = (company.subCategories ?? []).filter((s): s is Category => typeof s === 'object')
  const [licences, history, alerts, group] = await Promise.all([
    payload.find({ collection: 'licences', where: { company: { equals: company.id } }, depth: 1, limit: 50, sort: 'regulator' }),
    payload.find({
      collection: 'ratings',
      where: { company: { equals: company.id }, status: { equals: 'published' }, state: { equals: 'rated' } },
      sort: 'publishedAt',
      limit: 20,
      depth: 0,
    }),
    payload.find({ collection: 'alerts', where: { company: { equals: company.id }, active: { equals: true } }, sort: '-date', limit: 3, depth: 1 }),
    company.groupId
      ? payload.find({ collection: 'companies', where: { groupId: { equals: company.groupId }, id: { not_equals: company.id } }, limit: 10, depth: 0 })
      : Promise.resolve({ docs: [] as Company[] }),
  ])
  // Similar companies: same sub-category (or category) and country, by rating. Never shown on Partner pages.
  let similar: Awaited<ReturnType<typeof findCompanies>>['hits'] = []
  let featured = null
  if (company.tier !== 'partner') {
    const base = subs[0] ? { sub: [subs[0].slug] } : cat ? { category: [cat.slug] } : {}
    const res = await findCompanies({ ...base, country: company.hqCountry ? [company.hqCountry] : undefined }, 'rating', 1, 5)
    similar = res.hits.filter((h) => h.id !== company.id).slice(0, 3)
    const f = await featuredFor('similar', cat?.slug)
    featured = f && f.id !== company.id ? f : null
  }
  return {
    cat,
    subs,
    licences: licences.docs.map((l) => ({ ...l, reg: typeof l.regulator === 'object' ? (l.regulator as Regulator) : null })),
    history: history.docs,
    alerts: alerts.docs,
    group: group.docs,
    similar,
    featured,
  }
}
