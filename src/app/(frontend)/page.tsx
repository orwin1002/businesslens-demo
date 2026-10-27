import Link from 'next/link'

import { payloadClient } from '@/lib/payload'

export default async function Home() {
  const payload = await payloadClient()
  const { docs: firms } = await payload.find({ collection: 'firms', limit: 50, sort: 'name' })
  return (
    <>
      <section className="hero">
        <h1>Find a regulated firm</h1>
        <form action="/search" className="searchbar">
          <input name="q" placeholder="Firm name, licence number or regulator" />
          <button>Search</button>
        </form>
      </section>
      <h2>All demo firms</h2>
      <ul className="cards">
        {firms.map((f) => (
          <li key={f.id}>
            <Link href={`/firms/${f.slug}`}>{f.name}</Link>
            <span>{f.regulator} · {f.licenceNumber} · {f.country}</span>
          </li>
        ))}
      </ul>
    </>
  )
}
