import type { CollectionConfig, Payload, PayloadRequest, Where } from 'payload'

import { hasRole, signedIn } from '../access'
import { auditChange, auditDelete } from '../lib/audit'

const id = (v: unknown) => (typeof v === 'object' && v ? (v as { id: number }).id : (v as number))

// A very small first screen; anything it catches still goes to a moderator.
const BLOCKED = ['scam!!!', 'fuck', 'shit', 'idiot', 'bastard', 'http://', 'https://', 'www.', 'telegram', 'whatsapp']
const screen = (text: string) => {
  const hits = BLOCKED.filter((w) => text.toLowerCase().includes(w))
  return hits.length ? `Contains: ${hits.join(', ')}` : ''
}

// Keeps the Community Score on the company in step with approved reviews.
export async function refreshCommunityScore(payload: Payload, companyId: number, req?: PayloadRequest) {
  const { docs } = await payload.find({
    collection: 'reviews',
    where: { company: { equals: companyId }, status: { equals: 'approved' } },
    limit: 0,
    pagination: false,
    depth: 0,
    req,
    overrideAccess: true,
  })
  const avg = docs.length ? Math.round((docs.reduce((s, r) => s + r.rating, 0) / docs.length) * 10) / 10 : null
  await payload.update({
    collection: 'companies',
    id: companyId,
    data: { reviewCount: docs.length, reviewAverage: avg },
    req,
    overrideAccess: true,
    context: { system: true },
  })
}

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: {
    group: 'Moderation',
    useAsTitle: 'title',
    defaultColumns: ['title', 'company', 'rating', 'status', 'replyStatus', 'autoFlag', 'createdAt'],
    description: 'Every review and company reply waits here until a moderator approves it.',
  },
  access: {
    read: ({ req }): boolean | Where => {
      if (hasRole(req.user, 'moderator', 'editor', 'sales', 'analyst')) return true
      if (req.user) return { or: [{ status: { equals: 'approved' } }, { author: { equals: req.user.id } }] }
      return { status: { equals: 'approved' } }
    },
    create: signedIn,
    update: ({ req }) => hasRole(req.user, 'moderator'),
    delete: ({ req }) => hasRole(req.user, 'moderator'),
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        // Reviews written on the site always belong to the person signed in, staff included.
        if (operation === 'create' && req.user && !data.author && !req.context?.system) {
          data.author = req.user.id
          data.authorName ??= 'name' in req.user ? req.user.name || null : null
        }
        if (operation === 'create' && !hasRole(req.user, 'moderator') && !req.context?.system) {
          data.author = req.user?.id
          data.authorName = req.user && 'name' in req.user ? req.user.name || null : null
          data.status = 'pending'
          data.verified = false
          data.replyStatus = 'none'
          // One review per person per company every 12 months.
          const since = new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString()
          const { totalDocs } = await req.payload.count({
            collection: 'reviews',
            where: { company: { equals: id(data.company) }, author: { equals: req.user?.id }, createdAt: { greater_than: since } },
            req,
            overrideAccess: true,
          })
          if (totalDocs > 0) throw new Error('You have already reviewed this company in the last 12 months.')
        }
        if (data.title || data.body) data.autoFlag = screen(`${data.title ?? ''} ${data.body ?? ''}`)
        if (data.replyText && data.replyStatus === 'none') data.replyStatus = 'pending'
        return data
      },
    ],
    afterChange: [
      auditChange,
      async ({ doc, previousDoc, operation, req }) => {
        const companyId = id(doc.company)
        // Read this first: updating the company below shares req, and its context would mark this request as "system".
        const system = Boolean(req.context?.system)
        if (doc.status !== previousDoc?.status) await refreshCommunityScore(req.payload, companyId, req)
        if (system) return doc
        const author = !doc.author ? null : typeof doc.author === 'object' ? doc.author : await req.payload.findByID({ collection: 'users', id: doc.author, req, overrideAccess: true }).catch(() => null)
        if (!author?.email) return doc
        const send = (subject: string, html: string) =>
          req.payload.sendEmail({ to: author.email, subject, html }).catch((err: unknown) => req.payload.logger.error({ err, msg: 'Review email failed' }))
        if (operation === 'create') await send('We received your review', `<p>Thanks for your review "${doc.title}". It will appear once a moderator approves it.</p>`)
        else if (previousDoc?.status !== 'approved' && doc.status === 'approved') await send('Your review is live', `<p>Your review "${doc.title}" is now public on BusinessLens.</p>`)
        else if (previousDoc?.replyStatus !== 'approved' && doc.replyStatus === 'approved') await send('The company replied to your review', `<p>The company replied to your review "${doc.title}".</p>`)
        return doc
      },
    ],
    afterDelete: [auditDelete, async ({ doc, req }) => refreshCommunityScore(req.payload, id(doc.company), req)],
  },
  fields: [
    { type: 'row', fields: [{ name: 'company', type: 'relationship', relationTo: 'companies', required: true, index: true }, { name: 'author', type: 'relationship', relationTo: 'users' }, { name: 'authorName', label: 'Display name', type: 'text' }] },
    {
      type: 'row',
      fields: [
        { name: 'rating', type: 'number', min: 1, max: 5, required: true },
        { name: 'experienceDate', type: 'date', admin: { date: { pickerAppearance: 'monthOnly' } } },
        {
          name: 'relationship',
          type: 'select',
          options: [
            { label: 'Client', value: 'client' },
            { label: 'Former client', value: 'ex_client' },
            { label: 'Business partner', value: 'partner' },
          ],
        },
      ],
    },
    { name: 'title', type: 'text', required: true },
    { name: 'body', type: 'textarea', required: true },
    {
      name: 'proofNote',
      label: 'Proof (moderators only)',
      type: 'textarea',
      access: { read: ({ req }) => hasRole(req.user, 'moderator') },
      admin: { description: 'What the reviewer gave as proof of being a client. Never shown publicly.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'status', type: 'select', defaultValue: 'pending', required: true, options: ['pending', 'approved', 'rejected'] },
        { name: 'verified', label: 'Verified client', type: 'checkbox' },
        { name: 'autoFlag', label: 'Automatic screening', type: 'text', admin: { readOnly: true } },
      ],
    },
    { type: 'row', fields: [{ name: 'helpfulCount', type: 'number', defaultValue: 0, admin: { readOnly: true } }, { name: 'reportCount', type: 'number', defaultValue: 0, admin: { readOnly: true } }] },
    { name: 'helpfulVoters', type: 'relationship', relationTo: 'users', hasMany: true, admin: { hidden: true } },
    {
      type: 'collapsible',
      label: 'Company reply',
      fields: [
        { name: 'replyText', type: 'textarea' },
        { type: 'row', fields: [{ name: 'replyStatus', type: 'select', defaultValue: 'none', options: ['none', 'pending', 'approved', 'rejected'] }, { name: 'replyAt', type: 'date' }] },
      ],
    },
  ],
}
