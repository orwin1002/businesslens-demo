// BusinessLens marks for the admin panel (login page logo and nav icon).
const Lens = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
    <circle cx="14" cy="14" r="10" fill="none" stroke="#12355b" strokeWidth="3.2" />
    <path d="M9.5 15.5l3 3 6-7" fill="none" stroke="#1f7a5c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21.5 21.5l6 6" stroke="#12355b" strokeWidth="3.6" strokeLinecap="round" />
  </svg>
)

export function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Lens size={40} />
      <div>
        <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--theme-text)' }}>BusinessLens</div>
        <div style={{ fontSize: 13, color: 'var(--theme-elevation-500)' }}>Team admin</div>
      </div>
    </div>
  )
}

export function Icon() {
  return <Lens size={26} />
}
