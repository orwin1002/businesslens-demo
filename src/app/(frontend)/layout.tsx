import Link from 'next/link'
import React from 'react'

import { currentUser } from '@/lib/payload'
import './styles.css'

// Every page reads the signed-in user and live data, so nothing is pre-built.
export const dynamic = 'force-dynamic'

export const metadata = {
  description: 'A demo that checks every part of the BusinessLens stack works together.',
  title: 'BusinessLens Demo',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const user = await currentUser()
  return (
    <html lang="en">
      <body>
        <header className="top">
          <Link href="/" className="brand">BusinessLens <span>demo</span></Link>
          <nav>
            <Link href="/search">Search</Link>
            <Link href="/status">Status</Link>
            {user ? (
              <>
                <Link href="/account">{user.name || user.email}</Link>
                {user.role === 'admin' && <a href="/admin">Admin</a>}
              </>
            ) : (
              <>
                <Link href="/login">Sign in</Link>
                <Link href="/signup" className="button">Sign up</Link>
              </>
            )}
          </nav>
        </header>
        <main>{props.children}</main>
        <footer>All firms on this site are made up. It exists only to test the setup.</footer>
      </body>
    </html>
  )
}
