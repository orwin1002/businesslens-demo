import { previewWorkbook } from '@/lib/import'
import { requireRole } from '@/lib/staffAuth'

export const maxDuration = 120

export async function POST(request: Request) {
  const auth = await requireRole('editor')
  if (!auth) return Response.json({ error: 'Only admins and editors can import.' }, { status: 403 })
  const form = await request.formData()
  const file = form.get('file')
  if (!(file instanceof File)) return Response.json({ error: 'No file uploaded.' }, { status: 400 })
  try {
    const preview = await previewWorkbook(auth.payload, await file.arrayBuffer())
    return Response.json(preview)
  } catch (err) {
    return Response.json({ error: `Could not read the workbook: ${err instanceof Error ? err.message : err}` }, { status: 400 })
  }
}
