import Link from 'next/link'
import React from 'react'

import type { Company } from '@/payload-types'
import { Crumbs, Notice } from './CompanyList'
import { Avatar } from './Scores'
import { initials } from '@/lib/format'

// Page shell for the forms that live under a company URL (claim, rating review, error report).
export function CompanyForm({ c, title, intro, message, error, children }: { c: Company; title: string; intro: React.ReactNode; message?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="wrap" style={{ maxWidth: 760 }}>
      <div className="page-head">
        <Crumbs items={[{ label: 'Home', href: '/' }, { label: c.legalName, href: `/company/${c.slug}` }, { label: title }]} />
        <div className="row" style={{ flexWrap: 'nowrap' }}>
          <Avatar name={c.legalName} initials={initials(c.legalName)} logoUrl={c.tier !== 'standard' ? c.logoUrl : null} size={44} />
          <div>
            <h1 style={{ margin: 0, fontSize: 26 }}>{title}</h1>
            <Link href={`/company/${c.slug}`} className="small">{c.legalName}</Link>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="muted" style={{ marginBottom: 14 }}>{intro}</div>
        <Notice message={message} error={error} />
        {children}
      </div>
    </div>
  )
}
