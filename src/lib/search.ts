import { Meilisearch } from 'meilisearch'

// Meilisearch is optional in this demo. Without it, search falls back to the database.
export const INDEX = 'firms'

export function meili(): Meilisearch | null {
  const host = process.env.MEILI_HOST
  if (!host) return null
  return new Meilisearch({ host, apiKey: process.env.MEILI_API_KEY })
}

export type FirmDoc = {
  id: number | string
  name: string
  slug: string
  regulator?: string | null
  licenceNumber?: string | null
  country?: string | null
  category?: string | null
}

export function toSearchDoc(firm: FirmDoc) {
  return {
    id: firm.id,
    name: firm.name,
    slug: firm.slug,
    regulator: firm.regulator ?? '',
    licenceNumber: firm.licenceNumber ?? '',
    country: firm.country ?? '',
    category: firm.category ?? '',
  }
}

export async function indexFirms(firms: FirmDoc[]) {
  const client = meili()
  if (!client) return
  const index = client.index(INDEX)
  await index
    .updateSettings({
      searchableAttributes: ['name', 'licenceNumber', 'regulator', 'category', 'country'],
      filterableAttributes: ['country', 'regulator', 'category'],
    })
    .waitTask()
  await index.addDocuments(firms.map(toSearchDoc), { primaryKey: 'id' }).waitTask()
}

export async function removeFirm(id: number | string) {
  const client = meili()
  if (!client) return
  await client.index(INDEX).deleteDocument(id).waitTask()
}
