import { RichText } from '@payloadcms/richtext-lexical/react'
import { notFound } from 'next/navigation.js'

import { Crumbs } from '@/components/site/CompanyList'
import { fmtDate } from '@/lib/format'
import { payloadClient } from '@/lib/payload'

// Legal, trust and about pages edited in the CMS (Content → Pages).
type Props = { params: Promise<{ page: string }> }

async function load(slug: string) {
  const payload = await payloadClient()
  const { docs } = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
  if (!docs[0]) notFound()
  return docs[0]
}

export async function generateMetadata({ params }: Props) {
  const p = await load((await params).page)
  return { title: p.title, description: p.metaDescription ?? undefined }
}

export default async function CmsPage({ params }: Props) {
  const p = await load((await params).page)
  return (
    <div className="wrap" style={{ maxWidth: 820 }}>
      <div className="page-head">
        <Crumbs items={[{ label: 'Home', href: '/' }, { label: p.title }]} />
        <h1>{p.title}</h1>
        <p className="tiny muted">Last updated {fmtDate(p.updatedAt)}</p>
      </div>
      <article className="card prose" style={{ maxWidth: 'none' }}>{p.body && <RichText data={p.body} />}</article>
    </div>
  )
}
