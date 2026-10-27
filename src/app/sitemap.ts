import type { MetadataRoute } from 'next'

import { payloadClient } from '@/lib/payload'
import { siteURL } from '@/lib/site'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await payloadClient()
  const { docs } = await payload.find({ collection: 'firms', limit: 1000, pagination: false })
  const base = siteURL()
  return [
    { url: `${base}/`, changeFrequency: 'daily' },
    ...docs.map((f) => ({ url: `${base}/firms/${f.slug}`, lastModified: f.updatedAt })),
  ]
}
