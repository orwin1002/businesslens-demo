import Link from 'next/link'
import React from 'react'

import { CompareTray } from '@/components/site/Compare'
import { Footer, Header } from '@/components/site/Header'
import { currentUser } from '@/lib/payload'
import { siteURL } from '@/lib/site'
import './styles.css'

// Every page reads the signed-in user and live data, so nothing is pre-built.
export const dynamic = 'force-dynamic'

export const metadata = {
  metadataBase: new URL(siteURL()),
  title: { default: 'BusinessLens: ratings, licences and reviews of financial institutions', template: '%s · BusinessLens' },
  description: 'Independent ratings, verified licences and real reviews for brokers, banks, custodians, funds and fintechs across the Middle East and beyond.',
  robots: { index: false, follow: false },
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const user = await currentUser()
  return (
    <html lang="en" dir="ltr">
      <body>
        <div className="ribbon">
          Demo site for review. Firms marked “Example” are made up to show every feature; the UAE firms are real register data and not yet rated. <Link href="/about">About this demo</Link>
        </div>
        <Header user={user} />
        <main>{props.children}</main>
        <Footer />
        <CompareTray />
      </body>
    </html>
  )
}
