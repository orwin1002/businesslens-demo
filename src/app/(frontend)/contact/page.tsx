import { Crumbs, Notice } from '@/components/site/CompanyList'
import { Turnstile } from '@/components/site/Turnstile'
import type { PageProps } from '@/lib/params'
import { turnstileSiteKey } from '@/lib/turnstile'
import { submitLead } from '../actions'

export const metadata = { title: 'Contact us' }

export default async function Contact({ searchParams }: PageProps) {
  const sp = await searchParams
  return (
    <div className="wrap" style={{ maxWidth: 720 }}>
      <div className="page-head">
        <Crumbs items={[{ label: 'Home', href: '/' }, { label: 'Contact' }]} />
        <h1>Contact us</h1>
        <p className="muted">Questions, missing companies or press enquiries. To report wrong data about a company, use “Report an error” on its page so it reaches the data team directly.</p>
      </div>
      <div className="card">
        <Notice message={sp.message} error={sp.error} />
        <form action={submitLead} className="form">
          <input type="hidden" name="type" value="contact" />
          <input type="hidden" name="back" value="/contact" />
          <label>Name<input name="name" required /></label>
          <label>Email<input name="contact" type="email" required /></label>
          <label>Topic
            <select name="interest">
              <option>General question</option>
              <option>A company is missing</option>
              <option>Press</option>
              <option>Partnerships</option>
            </select>
          </label>
          <label>Message<textarea name="message" rows={5} required /></label>
          <Turnstile siteKey={turnstileSiteKey()} />
          <button className="btn">Send</button>
        </form>
      </div>
    </div>
  )
}
