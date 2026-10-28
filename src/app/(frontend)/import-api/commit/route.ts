import { commitChunk, type EntityPlan } from '@/lib/import'
import { requireRole } from '@/lib/staffAuth'

export const maxDuration = 300

export async function POST(request: Request) {
  const auth = await requireRole('editor')
  if (!auth) return Response.json({ error: 'Only admins and editors can import.' }, { status: 403 })
  const { plans, overwrite } = (await request.json()) as { plans: EntityPlan[]; overwrite: boolean }
  const results = await commitChunk(auth.payload, plans, Boolean(overwrite))
  return Response.json({ results })
}
