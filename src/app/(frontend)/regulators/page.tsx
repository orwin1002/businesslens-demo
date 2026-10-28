import Link from 'next/link'

import { Crumbs } from '@/components/site/CompanyList'
import { countryName } from '@/lib/countries'
import { findCompanies, getRegulators } from '@/lib/directory'

export const metadata = { title: 'Regulators', description: 'Financial regulators tracked by BusinessLens, with every firm they license.' }

export default async function Regulators() {
  const [{ all }, res] = await Promise.all([getRegulators(), findCompanies({}, 'rating', 1, 1, ['regulators'])])
  const byCountry = new Map<string, typeof all>()
  for (const r of all) byCountry.set(r.country ?? '', [...(byCountry.get(r.country ?? '') ?? []), r])
  return (
    <div className="wrap">
      <div className="page-head">
        <Crumbs items={[{ label: 'Home', href: '/' }, { label: 'Regulators' }]} />
        <h1>Regulators</h1>
        <p className="muted" style={{ maxWidth: 760 }}>Every licence on BusinessLens links back to the regulator’s own public register. Regulator names are shown as text; we do not use regulator logos.</p>
      </div>
      {[...byCountry.entries()].map(([code, regs]) => (
        <section className="section" key={code} style={{ paddingTop: 8 }}>
          <h2><Link href={`/country/${code.toLowerCase()}`} style={{ color: 'inherit' }}>{countryName(code)}</Link></h2>
          <div className="tiles">
            {regs.map((r) => (
              <Link key={r.id} className="tile" href={`/regulator/${r.slug}`}>
                <b>{r.code}</b>
                <span>{r.name}</span>
                <span className="tiny">{(res.facets.regulators?.[r.code] ?? 0).toLocaleString()} firms listed</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
