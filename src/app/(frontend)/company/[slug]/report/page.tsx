import { CompanyForm } from '@/components/site/CompanyForm'
import { Turnstile } from '@/components/site/Turnstile'
import { getCompany } from '@/lib/companyPage'
import type { SP } from '@/lib/params'
import { currentUser } from '@/lib/payload'
import { turnstileSiteKey } from '@/lib/turnstile'
import { submitReport } from '../../../actions'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SP> }

export const metadata = { title: 'Report an error', robots: { index: false } }

export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params
  const sp = await searchParams
  const [c, user] = await Promise.all([getCompany(slug), currentUser()])
  return (
    <CompanyForm c={c} title="Report an error" intro="Tell us what is wrong and where the correct information can be found. Our data team checks every report against the official sources." message={sp.message} error={sp.error}>
      {!sp.message && (
        <form action={submitReport} className="form">
          <input type="hidden" name="kind" value="data_error" />
          <input type="hidden" name="company" value={c.id} />
          <input type="hidden" name="slug" value={slug} />
          <label>Subject<input name="subject" placeholder="For example: Wrong licence number" required /></label>
          <label>Details and sources<textarea name="message" rows={5} required /></label>
          <label>Your name<input name="name" defaultValue={user?.name ?? ''} required /></label>
          <label>Email (for our reply)<input name="email" type="email" defaultValue={user?.email ?? ''} required /></label>
          <Turnstile siteKey={turnstileSiteKey()} />
          <button className="btn">Send</button>
        </form>
      )}
    </CompanyForm>
  )
}
