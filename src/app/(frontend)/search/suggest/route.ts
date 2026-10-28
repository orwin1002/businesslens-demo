import { NextResponse } from 'next/server'

import { countryName } from '@/lib/countries'
import { findCompanies } from '@/lib/directory'

// Autocomplete for every search box.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json({ hits: [] })
  const res = await findCompanies({ q }, 'relevance', 1, 7)
  return NextResponse.json({
    hits: res.hits.map((h) => ({
      slug: h.slug,
      name: h.name,
      initials: h.initials,
      logoUrl: h.logoUrl,
      meta: [h.category, countryName(h.country), h.regulators.slice(0, 3).join(', ')].filter(Boolean).join(' · '),
      why: h.matched,
    })),
  })
}
