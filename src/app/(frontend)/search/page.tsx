import Link from 'next/link'

import { payloadClient } from '@/lib/payload'
import { INDEX, meili } from '@/lib/search'
import type { PageProps } from '../Notice'

type Hit = { id: number | string; name: string; slug: string; regulator?: string; licenceNumber?: string; country?: string }

export default async function Search({ searchParams }: PageProps) {
  const q = ((await searchParams).q ?? '').trim()
  let hits: Hit[] = []
  let engine = 'none'
  let ms = 0
  if (q) {
    const started = Date.now()
    const client = meili()
    if (client) {
      const res = await client.index(INDEX).search<Hit>(q, { limit: 20 })
      hits = res.hits
      engine = 'Meilisearch'
    } else {
      // Fallback when Meilisearch isn't set up: a plain database search (no typo tolerance).
      const payload = await payloadClient()
      const res = await payload.find({
        collection: 'firms',
        limit: 20,
        where: { or: [{ name: { like: q } }, { licenceNumber: { like: q } }, { regulator: { like: q } }] },
      })
      hits = res.docs as Hit[]
      engine = 'Postgres (Meilisearch not set up)'
    }
    ms = Date.now() - started
  }
  return (
    <>
      <h1>Search</h1>
      <form className="searchbar">
        <input name="q" defaultValue={q} placeholder="Try a typo, like 'capitl'" autoFocus />
        <button>Search</button>
      </form>
      {q && (
        <p className="muted">
          {hits.length} result(s) from {engine} in {ms} ms
        </p>
      )}
      <ul className="cards">
        {hits.map((f) => (
          <li key={f.id}>
            <Link href={`/firms/${f.slug}`}>{f.name}</Link>
            <span>{f.regulator} · {f.licenceNumber} · {f.country}</span>
          </li>
        ))}
      </ul>
    </>
  )
}
