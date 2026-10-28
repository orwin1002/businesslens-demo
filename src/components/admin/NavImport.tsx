// Extra links at the bottom of the admin menu.
export function NavLinks() {
  const link: React.CSSProperties = { display: 'block', padding: '4px 0', color: 'var(--theme-text)' }
  return (
    <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--theme-elevation-100)' }}>
      <a href="/admin/import" style={link}>⇪ Import from Excel</a>
      <a href="/" target="_blank" style={link}>↗ View public site</a>
    </div>
  )
}
