import Link from 'next/link'

import { reportReview, voteHelpful } from '@/app/(frontend)/actions'
import { REVIEW_SORTS } from '@/lib/companyPage'
import { fmtDate, fmtMonth } from '@/lib/format'
import type { Review } from '@/payload-types'
import { Stars } from './Scores'

const REL: Record<string, string> = { client: 'Client', ex_client: 'Former client', partner: 'Business partner' }

export function ReviewItem({ r, slug, companyName }: { r: Review; slug: string; companyName: string }) {
  return (
    <article className="review" id={`review-${r.id}`}>
      <div className="row between">
        <div className="row" style={{ gap: 8 }}>
          <Stars value={r.rating} />
          <strong>{r.title}</strong>
        </div>
        <span className="tiny muted">{fmtMonth(r.experienceDate || r.createdAt)}</span>
      </div>
      <div className="row tiny muted" style={{ gap: 8, margin: '4px 0 6px' }}>
        <span>{r.authorName || 'BusinessLens member'}</span>
        {r.relationship && <span>· {REL[r.relationship]}</span>}
        {r.verified && <span className="chip ok">✓ Verified client</span>}
      </div>
      <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{r.body}</p>
      {r.replyStatus === 'approved' && r.replyText && (
        <div className="reply">
          <strong className="small">Reply from {companyName}</strong>
          <span className="tiny muted"> · {fmtDate(r.replyAt)}</span>
          <p style={{ margin: '4px 0 0' }}>{r.replyText}</p>
        </div>
      )}
      <div className="row tiny" style={{ marginTop: 8, gap: 10 }}>
        <form action={voteHelpful}>
          <input type="hidden" name="review" value={r.id} />
          <input type="hidden" name="slug" value={slug} />
          <button className="btn ghost small" style={{ padding: '2px 4px' }}>👍 Helpful ({r.helpfulCount ?? 0})</button>
        </form>
        <details>
          <summary className="muted" style={{ cursor: 'pointer' }}>Report</summary>
          <form action={reportReview} className="row" style={{ marginTop: 6 }}>
            <input type="hidden" name="review" value={r.id} />
            <input type="hidden" name="slug" value={slug} />
            <select name="reason" style={{ width: 'auto', padding: '6px 8px' }} aria-label="Reason">
              <option>Fake or not a real client</option>
              <option>Offensive language</option>
              <option>Contains personal data</option>
              <option>Conflict of interest</option>
            </select>
            <button className="btn secondary small">Send report</button>
          </form>
        </details>
      </div>
    </article>
  )
}

export function ReviewSortLinks({ base, current }: { base: string; current: string }) {
  return (
    <div className="row small" style={{ gap: 6 }}>
      <span className="muted">Sort:</span>
      {Object.entries(REVIEW_SORTS).map(([k, v]) => (
        <Link key={k} rel="nofollow" scroll={false} className={`chip${k === current ? ' partner' : ''}`} href={`${base}?rsort=${k}#reviews`}>{v.label}</Link>
      ))}
    </div>
  )
}
