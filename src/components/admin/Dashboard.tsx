import type { Payload, TypedUser } from 'payload'

type Props = { payload: Payload; user?: TypedUser | null }

// Top of the admin home page: work queues with live counts, then directory numbers.
export async function Dashboard({ payload, user }: Props) {
  const count = (collection: Parameters<Payload['count']>[0]['collection'], where = {}) =>
    payload.count({ collection, where, overrideAccess: true }).then((r) => r.totalDocs)
  const [reviews, replies, claims, edits, reports, leads, companies, rated, licences, alerts] = await Promise.all([
    count('reviews', { status: { equals: 'pending' } }),
    count('reviews', { replyStatus: { equals: 'pending' } }),
    count('claims', { status: { equals: 'new' } }),
    count('edit-requests', { status: { equals: 'new' } }),
    count('reports', { status: { equals: 'new' } }),
    count('leads', { status: { equals: 'new' } }),
    count('companies'),
    count('companies', { ratingState: { equals: 'rated' } }),
    count('licences'),
    count('alerts', { active: { equals: true } }),
  ])
  const queues = [
    { label: 'Reviews to moderate', n: reviews, href: '/admin/collections/reviews?where[status][equals]=pending' },
    { label: 'Company replies', n: replies, href: '/admin/collections/reviews?where[replyStatus][equals]=pending' },
    { label: 'Profile claims', n: claims, href: '/admin/collections/claims?where[status][equals]=new' },
    { label: 'Edit requests', n: edits, href: '/admin/collections/edit-requests?where[status][equals]=new' },
    { label: 'Error reports & rating reviews', n: reports, href: '/admin/collections/reports?where[status][equals]=new' },
    { label: 'New leads', n: leads, href: '/admin/collections/leads?where[status][equals]=new' },
  ]
  const stats = [
    { label: 'Companies', n: companies, href: '/admin/collections/companies' },
    { label: 'Rated', n: rated, href: '/admin/collections/ratings' },
    { label: 'Licences', n: licences, href: '/admin/collections/licences' },
    { label: 'Active alerts', n: alerts, href: '/admin/collections/alerts' },
  ]
  const box: React.CSSProperties = {
    border: '1px solid var(--theme-elevation-150)',
    borderRadius: 8,
    padding: '14px 16px',
    background: 'var(--theme-elevation-0)',
    textDecoration: 'none',
    color: 'var(--theme-text)',
    display: 'block',
  }
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ margin: '0 0 4px' }}>Welcome{user?.email ? `, ${user.email}` : ''}</h2>
      <p style={{ color: 'var(--theme-elevation-500)', margin: '0 0 16px' }}>
        Your role: <strong>{user?.role}</strong>. You only see the areas your role can use.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <a href="/admin/import" className="btn btn--style-primary btn--size-medium" style={{ margin: 0 }}>
          Import from Excel
        </a>
        <a href="/admin/collections/ratings/create" className="btn btn--style-secondary btn--size-medium" style={{ margin: 0 }}>
          New rating
        </a>
        <a href="/status" className="btn btn--style-secondary btn--size-medium" style={{ margin: 0 }}>
          System status
        </a>
      </div>
      <h3 style={{ margin: '0 0 10px' }}>Work queues</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
        {queues.map((q) => (
          <a key={q.label} href={q.href} style={{ ...box, borderColor: q.n ? '#d97706' : 'var(--theme-elevation-150)' }}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{q.n}</div>
            <div style={{ color: 'var(--theme-elevation-600)' }}>{q.label}</div>
          </a>
        ))}
      </div>
      <h3 style={{ margin: '0 0 10px' }}>Directory</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        {stats.map((s) => (
          <a key={s.label} href={s.href} style={box}>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{s.n.toLocaleString()}</div>
            <div style={{ color: 'var(--theme-elevation-600)' }}>{s.label}</div>
          </a>
        ))}
      </div>
    </div>
  )
}
