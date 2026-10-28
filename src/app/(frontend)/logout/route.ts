// Sign-out is a plain form post rather than a server action, so it keeps working
// in a tab that was opened before a new version of the site was deployed.
export async function POST() {
  return new Response(null, {
    status: 303,
    headers: {
      Location: '/',
      'Set-Cookie': `payload-token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
    },
  })
}
