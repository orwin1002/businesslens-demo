import React from 'react'

import { Notice } from './CompanyList'

// Narrow centred card used by sign-in, sign-up and password pages.
export function AuthCard({ title, intro, message, error, children }: { title: string; intro?: React.ReactNode; message?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="wrap section" style={{ maxWidth: 520 }}>
      <div className="card" style={{ padding: 28 }}>
        <h1 style={{ fontSize: 28 }}>{title}</h1>
        {intro && <p className="muted">{intro}</p>}
        <Notice message={message} error={error} />
        {children}
      </div>
    </div>
  )
}
