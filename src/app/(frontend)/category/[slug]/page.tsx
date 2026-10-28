import Link from 'next/link'

import { countryLinks, Listing } from '@/components/site/Listing'
import { resolveCategory } from '@/lib/categoryPage'
import { findCompanies } from '@/lib/directory'
import type { SP } from '@/lib/params'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SP> }

export async function generateMetadata({ params }: Props) {
  const { cat } = await resolveCategory((await params).slug)
  return { title: `${cat.name}: ratings, licences and reviews`, description: cat.intro ?? undefined }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params
  const sp = await searchParams
  const { cat, parent, base, deposit, mainSlug, subs } = await resolveCategory(slug)
  const countries = await findCompanies(base, 'rating', 1, 1, ['countries'])
  return (
    <Listing
      path={`/category/${slug}`}
      sp={sp}
      title={cat.name}
      crumbs={[{ label: 'Home', href: '/' }, ...(parent ? [{ label: parent.name, href: `/category/${parent.slug}` }] : []), { label: cat.name }]}
      base={base}
      featuredCategory={mainSlug}
      deposit={deposit}
      otherCountries={countryLinks(countries.facets.countries, '', (c) => `/category/${slug}/${c}`)}
      head={
        subs.length > 0 ? (
          <div className="chips" style={{ marginTop: 8 }}>
            {subs.map((s) => <Link key={s.id} className="chip" href={`/category/${s.slug}`}>{s.name}</Link>)}
          </div>
        ) : null
      }
      intro={cat.intro || parent?.intro ? <><h3>About this category</h3><p className="small" style={{ margin: 0 }}>{cat.intro || parent?.intro}</p></> : null}
    />
  )
}
