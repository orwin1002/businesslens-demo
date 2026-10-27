import Link from 'next/link'
import { redirect } from 'next/navigation.js'

import { currentUser, payloadClient } from '@/lib/payload'
import { logOut } from '../actions'

export default async function Account() {
  const user = await currentUser()
  if (!user) redirect('/login')
  const payload = await payloadClient()
  const { docs: reviews } = await payload.find({
    collection: 'reviews',
    where: { author: { equals: user.id } },
    depth: 1,
    sort: '-createdAt',
  })
  return (
    <>
      <h1>Hello, {user.name || user.email}</h1>
      <p className="muted">Signed in as {user.email} · role: {user.role}</p>
      {user.role === 'admin' && (
        <p>You're an admin. Approve reviews in the <a href="/admin/collections/reviews">admin panel</a>.</p>
      )}
      <h2>Your reviews</h2>
      {reviews.length === 0 && <p>None yet. Pick a firm from the <Link href="/">home page</Link>.</p>}
      <ul className="cards">
        {reviews.map((r) => (
          <li key={r.id}>
            <strong>{r.title}</strong>
            <span>{typeof r.firm === 'object' ? r.firm.name : ''} · {r.rating}/5 · {r.status}</span>
          </li>
        ))}
      </ul>
      <form action={logOut}><button className="secondary">Sign out</button></form>
    </>
  )
}
