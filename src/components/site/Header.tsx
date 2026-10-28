import Link from 'next/link'

import { hasRole, isStaffUser } from '@/access'
import { getCategories } from '@/lib/directory'
import type { User } from '@/payload-types'
import { HeaderSearchToggle, SearchBox } from './SearchBox'

export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="BusinessLens home">
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#12355b" />
        <circle cx="14" cy="14" r="7" fill="none" stroke="#fff" strokeWidth="3" />
        <path d="M19 19l6 6" stroke="#5fd3a8" strokeWidth="3.4" strokeLinecap="round" />
      </svg>
      BusinessLens
    </Link>
  )
}

const NAV = [
  { href: '/regulators', label: 'Regulators' },
  { href: '/compare', label: 'Compare' },
  { href: '/alerts', label: 'Alerts' },
  { href: '/methodology', label: 'How we rate' },
  { href: '/insights', label: 'Insights' },
  { href: '/business', label: 'For businesses' },
]

export async function Header({ user }: { user: User | null }) {
  const { mains, subsOf } = await getCategories()
  const account = user ? (
    <>
      {user.role === 'business' || hasRole(user) ? <Link href="/business/dashboard" className="hide-sm small">Dashboard</Link> : null}
      {isStaffUser(user) && <a href="/admin" className="hide-sm small">Admin</a>}
      <Link href="/account" className="btn secondary small">{(user.name || user.email).split(' ')[0]}</Link>
    </>
  ) : (
    <Link href="/login" className="btn ghost small hide-sm">Log in</Link>
  )
  return (
    <header className="site-header">
      <HeaderSearchToggle />
      <div className="wrap" style={{ position: 'relative' }}>
        <Logo />
        <nav className="mainnav" aria-label="Main">
          <details className="mega">
            <summary>Explore categories ▾</summary>
            <div className="mega-panel">
              {mains.filter((m) => !m.laterPhase).map((m) => (
                <div key={m.id}>
                  <h4><Link href={`/category/${m.slug}`}>{m.name}</Link></h4>
                  <ul>
                    {subsOf(m.id).slice(0, 5).map((s) => (
                      <li key={s.id}><Link href={`/category/${s.slug}`}>{s.name}</Link></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </details>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}>{n.label}</Link>
          ))}
        </nav>
        <div className="header-search hide-until-scroll">
          <SearchBox compact placeholder="Search…" />
        </div>
        <div className="header-actions">
          {account}
          <Link href="/review/new" className="btn small hide-sm">Write a review</Link>
        </div>
        <details className="burger">
          <summary aria-label="Menu">☰</summary>
          <div className="burger-panel">
            <Link href="/search">Search all companies</Link>
            {mains.filter((m) => !m.laterPhase).map((m) => (
              <Link key={m.id} href={`/category/${m.slug}`}>{m.name}</Link>
            ))}
            {NAV.map((n) => (
              <Link key={n.href} href={n.href}>{n.label}</Link>
            ))}
            <Link href="/review/new">Write a review</Link>
            {user ? <Link href="/account">My account</Link> : <Link href="/login">Log in</Link>}
            {user && isStaffUser(user) && <a href="/admin">Admin</a>}
          </div>
        </details>
      </div>
    </header>
  )
}

export function Footer() {
  const cols = [
    { title: 'Discover', links: [['/search', 'Search'], ['/regulators', 'Regulators'], ['/country/ae', 'UAE'], ['/compare', 'Compare'], ['/alerts', 'Alerts']] },
    { title: 'Trust', links: [['/methodology', 'How we rate'], ['/independence', 'Independence'], ['/review-guidelines', 'Review guidelines'], ['/complaints', 'Complaints'], ['/about', 'About']] },
    { title: 'For businesses', links: [['/business', 'Claim your profile'], ['/business#partner', 'Partner benefits'], ['/business/dashboard', 'Business dashboard'], ['/contact', 'Contact']] },
    { title: 'Legal', links: [['/terms', 'Terms'], ['/privacy', 'Privacy'], ['/cookies', 'Cookies'], ['/disclaimer', 'Disclaimer']] },
  ]
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="cols">
          {cols.map((c) => (
            <div key={c.title}>
              <h4>{c.title}</h4>
              <ul>
                {c.links.map(([href, label]) => (
                  <li key={href}><Link href={href}>{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="disclaimer">
          <p>Information only. Not investment advice. A BusinessLens Rating is an opinion on the information we verified, not a recommendation to deal with a company. Featured placements are paid and always labelled.</p>
          <p style={{ margin: 0 }}>Demo build. Companies marked “Example” are made up; all other companies come from public regulator registers and are not yet rated. <Link href="/status">System status</Link></p>
        </div>
      </div>
    </footer>
  )
}
