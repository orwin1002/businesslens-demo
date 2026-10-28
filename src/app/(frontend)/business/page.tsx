import Link from 'next/link'

import { Crumbs, Notice } from '@/components/site/CompanyList'
import { Turnstile } from '@/components/site/Turnstile'
import type { PageProps } from '@/lib/params'
import { turnstileSiteKey } from '@/lib/turnstile'
import { submitLead } from '../actions'

export const metadata = { title: 'For businesses: claim your profile', description: 'Claim your free BusinessLens profile, reply to reviews and see your rating breakdown. Partner profiles add branding, leads and more.' }

const TIERS = [
  { name: 'Standard', price: 'Every listed company', items: ['Verified licences and key facts', 'BusinessLens Rating and Community Score', 'Initials instead of a logo'] },
  { name: 'Claimed', price: 'Free', items: ['Your logo on the profile', 'Suggest corrections (we check every change)', 'One public reply per review', 'Your criteria breakdown with analyst comments', 'Business dashboard'] },
  { name: 'Partner', price: 'Subscription', items: ['Banner, video and extended description', 'Products, team, offices, news and documents', 'Call-back form: leads sent straight to you', 'Rating history chart and embeddable badge', 'No competitor listings on your page', 'Optional Featured slots, always labelled'] },
]

export default async function Business({ searchParams }: PageProps) {
  const sp = await searchParams
  return (
    <div className="wrap">
      <div className="page-head">
        <Crumbs items={[{ label: 'Home', href: '/' }, { label: 'For businesses' }]} />
        <h1>Your company is already on BusinessLens</h1>
        <p className="lead muted" style={{ maxWidth: 760, fontSize: 18 }}>Clients check us before they trust a firm with their money. Claim your profile to make sure what they see is complete and current.</p>
        <div className="row"><Link className="btn" href="/search">Find your company and claim it</Link><a className="btn secondary" href="#talk">Talk to us</a></div>
      </div>
      <section className="section" id="partner">
        <div className="tiles" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {TIERS.map((t) => (
            <div key={t.name} className="card" style={{ marginTop: 0, borderColor: t.name === 'Partner' ? 'var(--brand)' : undefined }}>
              <h2 style={{ marginBottom: 2 }}>{t.name}</h2>
              <p className="muted small">{t.price}</p>
              <ul style={{ paddingInlineStart: 18, margin: 0 }}>{t.items.map((i) => <li key={i}>{i}</li>)}</ul>
            </div>
          ))}
        </div>
        <p className="notice ok" style={{ marginTop: 16 }}>
          <strong>What money never buys:</strong> a higher rating, removal of reviews or alerts, or a different position in the normal rankings. See <Link href="/independence">Independence</Link>.
        </p>
      </section>
      <section className="section grid-2" id="talk">
        <div className="card">
          <h2>Talk to us</h2>
          <Notice message={sp.message} error={sp.error} />
          <form action={submitLead} className="form">
            <input type="hidden" name="type" value="business" />
            <input type="hidden" name="back" value="/business#talk" />
            <label>Name<input name="name" required /></label>
            <label>Work email or phone<input name="contact" required /></label>
            <label>Company<input name="organisation" required /></label>
            <label>Interested in
              <select name="interest"><option>Partner profile</option><option>Featured placement</option><option>Help claiming our profile</option><option>Data or API access</option></select>
            </label>
            <label>Message<textarea name="message" rows={4} /></label>
            <Turnstile siteKey={turnstileSiteKey()} />
            <button className="btn">Send</button>
          </form>
        </div>
        <div className="card">
          <h3>How claiming works</h3>
          <ol style={{ paddingInlineStart: 18 }}>
            <li>Find your company and click “Claim this profile”.</li>
            <li>Sign in and give your work email. An email at your company’s website domain is fastest.</li>
            <li>We check the claim by hand, usually within two working days.</li>
            <li>You get the business dashboard: replies, edit requests, rating breakdown, leads and your badge.</li>
          </ol>
          <p className="small muted" style={{ margin: 0 }}>Already approved? Go to your <Link href="/business/dashboard">business dashboard</Link>.</p>
        </div>
      </section>
    </div>
  )
}
