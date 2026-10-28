import type { MetadataRoute } from 'next'

import { findCompanies, getCategories, getRegulators } from '@/lib/directory'
import { payloadClient } from '@/lib/payload'
import { siteURL } from '@/lib/site'

export const dynamic = 'force-dynamic'

// Every page generated from the data: companies, categories, category × country, regulators, countries, alerts, content.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await payloadClient()
  const base = siteURL()
  const [{ all: cats }, { all: regs }, companies, insights, pages, alerts, countries] = await Promise.all([
    getCategories(),
    getRegulators(),
    payload.find({ collection: 'companies', where: { archived: { not_equals: true } }, limit: 0, pagination: false, depth: 0, select: { slug: true, updatedAt: true } }),
    payload.find({ collection: 'insights', where: { publishedAt: { exists: true } }, limit: 0, pagination: false, depth: 0, select: { slug: true, updatedAt: true } }),
    payload.find({ collection: 'pages', limit: 0, pagination: false, depth: 0, select: { slug: true, updatedAt: true } }),
    payload.find({ collection: 'alerts', limit: 0, pagination: false, depth: 0, select: { updatedAt: true } }),
    findCompanies({}, 'rating', 1, 1, ['countries']),
  ])
  const catCountry = await Promise.all(
    cats.map(async (c) => {
      const res = await findCompanies(c.parent ? { sub: [c.slug] } : { category: [c.slug] }, 'rating', 1, 1, ['countries'])
      return Object.keys(res.facets.countries ?? {}).map((code) => `${base}/category/${c.slug}/${code.toLowerCase()}`)
    }),
  )
  const url = (path: string, lastModified?: string): MetadataRoute.Sitemap[number] => ({ url: `${base}${path}`, ...(lastModified ? { lastModified } : {}) })
  return [
    url('/'),
    ...['/search', '/regulators', '/alerts', '/methodology', '/insights', '/business', '/contact'].map((p) => url(p)),
    ...pages.docs.map((p) => url(`/${p.slug}`, p.updatedAt)),
    ...cats.map((c) => url(`/category/${c.slug}`)),
    ...catCountry.flat().map((u) => ({ url: u })),
    ...Object.keys(countries.facets.countries ?? {}).map((code) => url(`/country/${code.toLowerCase()}`)),
    ...regs.map((r) => url(`/regulator/${r.slug}`)),
    ...companies.docs.map((c) => url(`/company/${c.slug}`, c.updatedAt)),
    ...insights.docs.map((i) => url(`/insights/${i.slug}`, i.updatedAt)),
    ...alerts.docs.map((a) => url(`/alerts/${a.id}`, a.updatedAt)),
  ]
}
