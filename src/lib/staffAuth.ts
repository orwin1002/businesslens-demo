import { headers as getHeaders } from 'next/headers.js'

import { hasRole } from '@/access'
import { payloadClient } from './payload'

// For admin-only API routes: returns payload and user, or null if not allowed.
export async function requireRole(...roles: string[]) {
  const payload = await payloadClient()
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user || !hasRole(user, ...roles)) return null
  return { payload, user }
}
