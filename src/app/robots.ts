import type { MetadataRoute } from 'next'

import { siteURL } from '@/lib/site'

// This is a demo site, so search engines are asked to stay away. The real site will allow everything except /admin and /account.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', disallow: '/' },
    sitemap: `${siteURL()}/sitemap.xml`,
  }
}
