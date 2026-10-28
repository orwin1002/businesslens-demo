import { hasRole } from '@/access'
import { currentUser, payloadClient } from '@/lib/payload'

const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""').replace(/^([=+\-@])/, "'$1")}"`

// Leads for one company as a spreadsheet file. Only that company's users (or an admin) can download it.
export async function GET(req: Request) {
  const user = await currentUser()
  if (!user) return new Response('Sign in first', { status: 401 })
  const id = Number(new URL(req.url).searchParams.get('company'))
  const payload = await payloadClient()
  const company = await payload.findByID({ collection: 'companies', id, depth: 0 }).catch(() => null)
  const managers = (company?.managers ?? []).map((m) => (typeof m === 'object' ? m.id : m))
  if (!company || (!managers.includes(user.id) && !hasRole(user))) return new Response('Not allowed', { status: 403 })
  const { docs } = await payload.find({ collection: 'leads', where: { company: { equals: id } }, sort: '-createdAt', limit: 0, pagination: false, depth: 0 })
  const rows = [['Date', 'Name', 'Contact', 'Interest', 'Message', 'Consent'], ...docs.map((l) => [l.createdAt, l.name, l.contact, l.interest, l.message, l.consent ? 'yes' : 'no'])]
  return new Response(rows.map((r) => r.map(cell).join(',')).join('\r\n'), {
    headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="${company.slug}-leads.csv"` },
  })
}
