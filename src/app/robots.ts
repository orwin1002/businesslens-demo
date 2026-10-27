import type { MetadataRoute } from 'next'

import { siteURL } from '@/lib/site'

// This is a test site, so search engines are asked to stay away.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', disallow: '/' },
    sitemap: `${siteURL()}/sitemap.xml`,
  }
}
