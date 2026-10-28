import { notFound } from 'next/navigation.js'

import { getCategories } from './directory'

// Resolves a category or sub-category slug for the category pages.
export async function resolveCategory(slug: string) {
  const cats = await getCategories()
  const cat = cats.bySlug.get(slug)
  if (!cat) notFound()
  const parentId = typeof cat.parent === 'object' ? cat.parent?.id : cat.parent
  const parent = parentId ? cats.all.find((c) => c.id === parentId) ?? null : null
  const main = parent ?? cat
  return {
    cat,
    parent,
    base: parent ? { sub: [cat.slug] } : { category: [cat.slug] },
    deposit: main.slug === 'brokers',
    mainSlug: main.slug,
    subs: parent ? [] : cats.subsOf(cat.id),
  }
}
