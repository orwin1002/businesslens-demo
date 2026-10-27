import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'

import config from '@/payload.config'

export async function payloadClient() {
  return getPayload({ config: await config })
}

// The signed-in user, or null.
export async function currentUser() {
  const headers = await getHeaders()
  const payload = await payloadClient()
  const { user } = await payload.auth({ headers })
  return user
}
