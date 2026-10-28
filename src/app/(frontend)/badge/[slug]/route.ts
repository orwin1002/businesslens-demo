import { payloadClient } from '@/lib/payload'

const esc = (s: string) => s.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`)

// Embeddable rating badge (SVG). It always shows the live rating, so it can't go out of date.
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await payloadClient()
  const { docs } = await payload.find({ collection: 'companies', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
  const c = docs[0]
  if (!c) return new Response('Not found', { status: 404 })
  const rated = c.ratingState === 'rated' && c.ratingOverall != null
  const color = rated ? c.ratingColor || '#1d4ed8' : '#64708a'
  const big = rated ? `${c.ratingOverall!.toFixed(1)}` : '—'
  const line = rated ? `${c.ratingBand} · BusinessLens Rating` : c.ratingState === 'suspended' ? 'Rating suspended' : 'Not yet rated'
  const name = c.legalName.length > 30 ? c.legalName.slice(0, 29) + '…' : c.legalName
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="64" viewBox="0 0 220 64" role="img" aria-label="${esc(c.legalName)}: ${esc(line)} ${big}">
<rect x="0.5" y="0.5" width="219" height="63" rx="10" fill="#fff" stroke="#e1e6ef"/>
<rect x="8" y="8" width="48" height="48" rx="8" fill="${color}"/>
<text x="32" y="39" text-anchor="middle" font-family="Segoe UI,Roboto,Arial,sans-serif" font-size="${rated ? 19 : 22}" font-weight="700" fill="#fff">${big}</text>
<text x="66" y="25" font-family="Segoe UI,Roboto,Arial,sans-serif" font-size="11.5" font-weight="700" fill="#14213d">${esc(name)}</text>
<text x="66" y="41" font-family="Segoe UI,Roboto,Arial,sans-serif" font-size="10.5" fill="#3d4a63">${esc(line)}</text>
<text x="66" y="54" font-family="Segoe UI,Roboto,Arial,sans-serif" font-size="9" fill="#64708a">businesslens · verified ${new Date().toISOString().slice(0, 7)}</text>
</svg>`
  return new Response(svg, { headers: { 'content-type': 'image/svg+xml', 'cache-control': 'public, max-age=3600' } })
}
