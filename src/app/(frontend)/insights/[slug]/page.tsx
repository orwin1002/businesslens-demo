import { RichText } from '@payloadcms/richtext-lexical/react'
import { notFound } from 'next/navigation.js'

import { Crumbs, JsonLd } from '@/components/site/CompanyList'
import { fmtDate } from '@/lib/format'
import { payloadClient } from '@/lib/payload'

type Props = { params: Promise<{ slug: string }> }

async function load(slug: string) {
  const payload = await payloadClient()
  const { docs } = await payload.find({ collection: 'insights', where: { slug: { equals: slug }, publishedAt: { exists: true } }, limit: 1, depth: 0 })
  if (!docs[0]) notFound()
  return docs[0]
}

export async function generateMetadata({ params }: Props) {
  const a = await load((await params).slug)
  return { title: a.metaTitle || a.title, description: a.metaDescription || a.excerpt || undefined }
}

export default async function Article({ params }: Props) {
  const a = await load((await params).slug)
  return (
    <div className="wrap" style={{ maxWidth: 760 }}>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'Article', headline: a.title, datePublished: a.publishedAt, author: { '@type': 'Organization', name: a.author || 'BusinessLens' } }} />
      <div className="page-head">
        <Crumbs items={[{ label: 'Home', href: '/' }, { label: 'Insights', href: '/insights' }, { label: a.title }]} />
        <h1>{a.title}</h1>
        <p className="muted">{fmtDate(a.publishedAt)} · {a.author}</p>
      </div>
      <article className="card prose" style={{ maxWidth: 'none' }}>
        {a.excerpt && <p className="lead" style={{ fontSize: 18 }}>{a.excerpt}</p>}
        {a.body && <RichText data={a.body} />}
      </article>
    </div>
  )
}
