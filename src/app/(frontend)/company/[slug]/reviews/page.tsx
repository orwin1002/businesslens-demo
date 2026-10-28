import Link from 'next/link'

import { Crumbs, Pager } from '@/components/site/CompanyList'
import { ReviewItem, ReviewSortLinks } from '@/components/site/Reviews'
import { CommunityScore } from '@/components/site/Scores'
import { getCompany, getReviews } from '@/lib/companyPage'
import type { SP } from '@/lib/params'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SP> }

export async function generateMetadata({ params }: Props) {
  const c = await getCompany((await params).slug)
  return { title: `${c.legalName} reviews` }
}

export default async function AllReviews({ params, searchParams }: Props) {
  const { slug } = await params
  const sp = await searchParams
  const c = await getCompany(slug)
  const rsort = sp.rsort ?? 'newest'
  const page = Math.max(1, Number(sp.page) || 1)
  const reviews = await getReviews(c.id, rsort, page, 20)
  return (
    <div className="wrap" style={{ maxWidth: 860 }}>
      <div className="page-head">
        <Crumbs items={[{ label: 'Home', href: '/' }, { label: c.legalName, href: `/company/${slug}` }, { label: 'Reviews' }]} />
        <h1>{c.legalName} reviews</h1>
        <div className="row"><CommunityScore big avg={c.reviewAverage} count={c.reviewCount} /><Link className="btn" href={`/review/new?company=${slug}`}>Write a review</Link></div>
      </div>
      <div className="card" id="reviews">
        <ReviewSortLinks base={`/company/${slug}/reviews`} current={rsort} />
        {reviews.docs.map((r) => <ReviewItem key={r.id} r={r} slug={slug} companyName={c.legalName} />)}
        {reviews.docs.length === 0 && <p className="muted">No reviews yet.</p>}
      </div>
      <Pager page={page} pages={reviews.totalPages} href={(p) => `/company/${slug}/reviews?rsort=${rsort}&page=${p}`} />
    </div>
  )
}
