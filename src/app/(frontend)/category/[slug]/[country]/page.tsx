import { notFound } from 'next/navigation.js'

import { countryLinks, Listing } from '@/components/site/Listing'
import { resolveCategory } from '@/lib/categoryPage'
import { COUNTRIES, countryName } from '@/lib/countries'
import { findCompanies } from '@/lib/directory'
import type { SP } from '@/lib/params'

type Props = { params: Promise<{ slug: string; country: string }>; searchParams: Promise<SP> }

const inCountry = (code: string) => (['AE', 'GB', 'US'].includes(code) ? `the ${countryName(code)}` : countryName(code))

export async function generateMetadata({ params }: Props) {
  const { slug, country } = await params
  const { cat } = await resolveCategory(slug)
  const code = country.toUpperCase()
  return {
    title: `${cat.name} in ${inCountry(code)}: ratings and licences`,
    description: `Every ${cat.name.toLowerCase()} firm licensed in ${inCountry(code)}, with its regulator, licence number, BusinessLens Rating and reviews.`,
  }
}

export default async function CategoryCountry({ params, searchParams }: Props) {
  const { slug, country } = await params
  const sp = await searchParams
  const code = country.toUpperCase()
  if (!COUNTRIES[code]) notFound()
  const { cat, parent, base, deposit, mainSlug } = await resolveCategory(slug)
  const countries = await findCompanies(base, 'rating', 1, 1, ['countries'])
  return (
    <Listing
      path={`/category/${slug}/${country}`}
      sp={sp}
      title={`${cat.name} in ${inCountry(code)}`}
      crumbs={[
        { label: 'Home', href: '/' },
        ...(parent ? [{ label: parent.name, href: `/category/${parent.slug}` }] : []),
        { label: cat.name, href: `/category/${slug}` },
        { label: countryName(code) },
      ]}
      base={{ ...base, country: [code] }}
      featuredCategory={mainSlug}
      deposit={deposit}
      otherCountries={countryLinks(countries.facets.countries, code, (c) => `/category/${slug}/${c}`)}
      intro={cat.intro || parent?.intro ? <><h3>About this category</h3><p className="small" style={{ margin: 0 }}>{cat.intro || parent?.intro}</p></> : null}
    />
  )
}
