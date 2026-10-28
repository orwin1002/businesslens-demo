import Link from 'next/link'
import { notFound } from 'next/navigation.js'

import { currentUser, payloadClient } from '@/lib/payload'
import { turnstileSiteKey } from '@/lib/turnstile'
import { postReview } from '../../actions'
import { Turnstile } from '../../Turnstile'
import { Notice } from '../../Notice'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ message?: string; error?: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const payload = await payloadClient()
  const { docs } = await payload.find({ collection: 'firms', where: { slug: { equals: slug } }, limit: 1 })
  return docs[0] ? { title: `${docs[0].name} reviews | BusinessLens Demo`, description: docs[0].description } : {}
}

export default async function FirmPage({ params, searchParams }: Props) {
  const { slug } = await params
  const sp = await searchParams
  const payload = await payloadClient()
  const user = await currentUser()
  const { docs } = await payload.find({ collection: 'firms', where: { slug: { equals: slug } }, limit: 1 })
  const firm = docs[0]
  if (!firm) notFound()
  const { docs: reviews } = await payload.find({
    collection: 'reviews',
    where: { firm: { equals: firm.id }, status: { equals: 'approved' } },
    sort: '-createdAt',
    depth: 1,
  })
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null

  return (
    <>
      <h1>{firm.name}</h1>
      <p className="muted">
        {firm.category} · Regulated by {firm.regulator} · Licence {firm.licenceNumber} · {firm.country}
      </p>
      <p>{firm.description}</p>
      <p className="score">{avg ? `${avg.toFixed(1)} / 5 from ${reviews.length} review(s)` : 'No reviews yet'}</p>

      <Notice message={sp.message} error={sp.error} />

      <h2>Reviews</h2>
      {reviews.map((r) => (
        <article key={r.id} className="review">
          <strong>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)} {r.title}</strong>
          <p>{r.body}</p>
          <span className="muted">by {typeof r.author === 'object' ? r.author.name || 'a member' : 'a member'}</span>
        </article>
      ))}

      <h2>Write a review</h2>
      {user ? (
        <form action={postReview} className="stack">
          <input type="hidden" name="firm" value={firm.id} />
          <input type="hidden" name="slug" value={firm.slug} />
          <label>Rating
            <select name="rating" defaultValue="5">
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}
            </select>
          </label>
          <label>Title<input name="title" required /></label>
          <label>Your review<textarea name="body" rows={4} required /></label>
          <Turnstile siteKey={turnstileSiteKey()} />
          <button>Send review</button>
        </form>
      ) : (
        <p><Link href="/login">Sign in</Link> to write a review.</p>
      )}
    </>
  )
}
