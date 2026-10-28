import Link from 'next/link'
import { notFound } from 'next/navigation.js'

import { Listing } from '@/components/site/Listing'
import { COUNTRIES, countryName } from '@/lib/countries'
import { getRegulators } from '@/lib/directory'
import type { SP } from '@/lib/params'

type Props = { params: Promise<{ code: string }>; searchParams: Promise<SP> }

export async function generateMetadata({ params }: Props) {
  const code = (await params).code.toUpperCase()
  return { title: `Financial institutions in ${countryName(code)}`, description: `Licensed brokers, banks, funds and fintechs in ${countryName(code)}, with regulators, ratings and reviews.` }
}

export default async function CountryPage({ params, searchParams }: Props) {
  const code = (await params).code.toUpperCase()
  const sp = await searchParams
  if (!COUNTRIES[code]) notFound()
  const regs = (await getRegulators()).all.filter((r) => r.country === code)
  return (
    <Listing
      path={`/country/${code.toLowerCase()}`}
      sp={sp}
      title={`Financial institutions in ${countryName(code)}`}
      crumbs={[{ label: 'Home', href: '/' }, { label: countryName(code) }]}
      base={{ country: [code] }}
      quickFilter="category"
      head={
        regs.length > 0 ? (
          <div className="stack" style={{ marginTop: 10 }}>
            <h2 style={{ fontSize: 18, margin: 0 }}>Regulators in {countryName(code)}</h2>
            <div className="tiles">
              {regs.map((r) => (
                <Link key={r.id} className="tile" href={`/regulator/${r.slug}`}><b>{r.code}</b><span>{r.name}</span></Link>
              ))}
            </div>
          </div>
        ) : null
      }
    />
  )
}
