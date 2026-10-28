import { notFound } from 'next/navigation.js'

import { Listing } from '@/components/site/Listing'
import type { SP } from '@/lib/params'
import { payloadClient } from '@/lib/payload'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SP> }

// One page per company group, so a brand search lands on all its licensed entities.
async function load(slug: string) {
  const payload = await payloadClient()
  const { docs } = await payload.find({ collection: 'companies', where: { groupId: { equals: slug.toUpperCase() } }, limit: 50, depth: 0, sort: 'legalName' })
  if (!docs.length) notFound()
  const brand = docs.flatMap((d) => d.brandNames ?? []).map((b) => b.name)[0]
  return { docs, name: brand ? `${brand} group` : `${docs[0].legalName} and related entities` }
}

export async function generateMetadata({ params }: Props) {
  const { name } = await load((await params).slug)
  return { title: name }
}

export default async function GroupPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { docs, name } = await load(slug)
  return (
    <Listing
      path={`/group/${slug}`}
      sp={await searchParams}
      title={name}
      crumbs={[{ label: 'Home', href: '/' }, { label: 'Company groups' }, { label: name }]}
      base={{ group: docs[0].groupId! }}
      intro={<><h3>About groups</h3><p className="small" style={{ margin: 0 }}>Each licensed entity in a group has its own profile, licences and rating. Ratings are never shared between entities.</p></>}
    />
  )
}
