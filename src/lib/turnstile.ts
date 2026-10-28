// Cloudflare Turnstile, the "are you human?" check. Optional: without keys, forms work without it.
export const turnstileSiteKey = () => process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''

export async function passedTurnstile(form: FormData): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  const token = String(form.get('cf-turnstile-response') ?? '')
  if (!token) return false
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret, response: token }),
  })
  const data = (await res.json()) as { success: boolean }
  return data.success
}
