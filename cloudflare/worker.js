// Cloudflare Worker: puts the demo site behind Cloudflare without needing a domain.
// Paste this into Cloudflare > Workers & Pages > your worker > Edit code, then change ORIGIN below.

const ORIGIN = 'https://YOUR-SITE.vercel.app' // <- your Vercel address, no slash at the end

export default {
  async fetch(request) {
    const url = new URL(request.url)
    const target = new URL(url.pathname + url.search, ORIGIN)

    const headers = new Headers(request.headers)
    // Tell the site the visit came through Cloudflare, and from which country.
    headers.set('x-cf-ray', request.headers.get('cf-ray') || '')
    headers.set('x-cf-country', request.headers.get('cf-ipcountry') || '')
    headers.set('x-forwarded-host', url.host)

    const response = await fetch(target, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
      redirect: 'manual',
    })

    // If the site redirects to its Vercel address, keep the visitor on the Cloudflare address.
    const out = new Response(response.body, response)
    const location = out.headers.get('location')
    if (location && location.startsWith(ORIGIN)) {
      out.headers.set('location', url.origin + location.slice(ORIGIN.length))
    }
    return out
  },
}
