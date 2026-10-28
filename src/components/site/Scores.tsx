import { fmtDate } from '@/lib/format'

type RatingProps = {
  state?: string | null
  rating?: number | null
  band?: string | null
  color?: string | null
  date?: string | null
  note?: string | null
  size?: 'mini' | 'full'
}

// The BusinessLens Rating (expert, out of 10). Never combined with the Community Score.
export function RatingBadge({ state, rating, band, color, date, note, size = 'full' }: RatingProps) {
  const hasScore = rating != null && (state === 'rated' || state === 'under_review')
  if (size === 'mini') {
    if (state === 'suspended') return <span className="badge-mini grey">Rating suspended</span>
    if (!hasScore) return <span className="badge-mini grey">Not yet rated</span>
    return (
      <span className="row" style={{ gap: 6 }}>
        <span className="badge-mini" style={{ background: color || '#1d4ed8' }}>{rating!.toFixed(1)}</span>
        <span className="small muted">{band}{state === 'under_review' ? ' · under review' : ''}</span>
      </span>
    )
  }
  if (state === 'suspended')
    return (
      <div className="scorebox" title="BusinessLens Rating">
        <div className="score-label"><strong>Rating suspended</strong><br />{note || 'Rating paused while we check information about this company.'}</div>
      </div>
    )
  if (!hasScore)
    return (
      <div className="scorebox" title="BusinessLens Rating">
        <div className="score-num" style={{ color: 'var(--muted)', fontSize: 18 }}>Not yet rated</div>
        <div className="score-label">BusinessLens Rating<br />All facts below are still verified</div>
      </div>
    )
  return (
    <div className="scorebox" title="BusinessLens Rating" style={{ borderColor: color || undefined }}>
      <div className="score-num" style={{ color: color || undefined }}>{rating!.toFixed(1)}<small> / 10</small></div>
      <div className="score-label">
        <strong>BusinessLens Rating · {band}</strong>
        <br />
        {state === 'under_review' ? <span style={{ color: 'var(--warn)' }}>Under review · previous score</span> : `Rated ${fmtDate(date)}`}
      </div>
    </div>
  )
}

export function Stars({ value, size = 15 }: { value: number; size?: number }) {
  const full = Math.round(value)
  return (
    <span className="stars" style={{ fontSize: size }} aria-label={`${value} out of 5 stars`}>
      {'★'.repeat(full)}
      <span className="off">{'★'.repeat(5 - full)}</span>
    </span>
  )
}

// The Community Score (user reviews, 1 to 5 stars).
export function CommunityScore({ avg, count, big = false }: { avg?: number | null; count?: number | null; big?: boolean }) {
  if (!count)
    return big ? (
      <div className="scorebox"><div className="score-label"><strong>Community Score</strong><br />No reviews yet</div></div>
    ) : (
      <span className="community muted">No reviews</span>
    )
  if (big)
    return (
      <div className="scorebox" title="Community Score from user reviews">
        <div className="score-num">{avg?.toFixed(1)}<small> ★</small></div>
        <div className="score-label"><strong>Community Score</strong><br />{count} review{count === 1 ? '' : 's'}</div>
      </div>
    )
  return (
    <span className="community" title="Community Score">
      <Stars value={avg ?? 0} size={13} /> {avg?.toFixed(1)} <span className="muted">({count})</span>
    </span>
  )
}

export function Avatar({ name, initials, logoUrl, size = 48 }: { name: string; initials: string; logoUrl?: string | null; size?: number }) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.36 }} aria-hidden="true">
      {logoUrl ? <img src={logoUrl} alt={`${name} logo`} /> : initials}
    </span>
  )
}
