import { rebuildIndex } from '@/lib/search'
import { requireRole } from '@/lib/staffAuth'

export const maxDuration = 300

// After an import: rebuild the search index once, and write one audit entry for the whole batch.
export async function POST(request: Request) {
  const auth = await requireRole('editor')
  if (!auth) return Response.json({ error: 'Not allowed.' }, { status: 403 })
  const { summary, fileName } = (await request.json()) as { summary: string; fileName: string }
  await auth.payload.create({
    collection: 'audit-log',
    data: { action: 'import', collectionSlug: 'companies', docId: '-', docLabel: fileName, changedFields: summary, user: auth.user.id },
    overrideAccess: true,
    context: { skipAudit: true },
  })
  let indexed = 0
  try {
    indexed = await rebuildIndex(auth.payload)
  } catch (err) {
    return Response.json({ indexed, warning: `Search index not updated: ${err instanceof Error ? err.message : err}` })
  }
  return Response.json({ indexed })
}
