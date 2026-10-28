import type { CollectionConfig } from 'payload'

import { anyone, hasRole, roles } from '../access'
import { auditChange, auditDelete } from '../lib/audit'
import { domainOf } from '../lib/format'

const id = (v: unknown) => (typeof v === 'object' && v ? (v as { id: number }).id : (v as number))
const STATUS = { name: 'status', type: 'select' as const, defaultValue: 'new', required: true, options: ['new', 'in_progress', 'approved', 'rejected', 'done'] }
const hooks = { afterChange: [auditChange], afterDelete: [auditDelete] }

export const Claims: CollectionConfig = {
  slug: 'claims',
  admin: { group: 'Moderation', useAsTitle: 'workEmail', defaultColumns: ['company', 'name', 'workEmail', 'domainMatch', 'status', 'createdAt'], description: 'Approving a claim makes the company Claimed and gives the person access to the business dashboard.' },
  access: { read: roles('moderator', 'sales'), create: anyone, update: roles('moderator'), delete: roles() },
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation === 'create') {
          if (req.user) data.user = req.user.id
          const company = await req.payload.findByID({ collection: 'companies', id: id(data.company), req, depth: 0, overrideAccess: true })
          data.domainMatch = Boolean(company.website && String(data.workEmail ?? '').toLowerCase().endsWith('@' + domainOf(company.website)))
          data.status = 'new'
        }
        return data
      },
    ],
    afterChange: [
      auditChange,
      async ({ doc, previousDoc, req }) => {
        if (doc.status !== 'approved' || previousDoc?.status === 'approved') return doc
        const company = await req.payload.findByID({ collection: 'companies', id: id(doc.company), req, depth: 0, overrideAccess: true })
        const managers = (company.managers ?? []).map(id)
        const userId = id(doc.user)
        await req.payload.update({
          collection: 'companies',
          id: company.id,
          data: { tier: company.tier === 'standard' ? 'claimed' : company.tier, managers: userId ? [...new Set([...managers, userId])] : managers },
          req,
          overrideAccess: true,
          context: { system: true },
        })
        if (userId) {
          const user = await req.payload.findByID({ collection: 'users', id: userId, req, overrideAccess: true })
          if (user.role === 'member') await req.payload.update({ collection: 'users', id: userId, data: { role: 'business' }, req, overrideAccess: true })
        }
        await req.payload
          .sendEmail({ to: doc.workEmail, subject: `Your claim for ${company.legalName} is approved`, html: `<p>You can now manage ${company.legalName} from your BusinessLens business dashboard.</p>` })
          .catch(() => undefined)
        return doc
      },
    ],
    afterDelete: [auditDelete],
  },
  fields: [
    { type: 'row', fields: [{ name: 'company', type: 'relationship', relationTo: 'companies', required: true }, { name: 'user', type: 'relationship', relationTo: 'users' }] },
    { type: 'row', fields: [{ name: 'name', type: 'text', required: true }, { name: 'jobTitle', type: 'text' }, { name: 'workEmail', type: 'email', required: true }] },
    { name: 'message', type: 'textarea' },
    { type: 'row', fields: [STATUS, { name: 'domainMatch', label: 'Email matches company website', type: 'checkbox', admin: { readOnly: true } }] },
  ],
}

export const EditRequests: CollectionConfig = {
  slug: 'edit-requests',
  admin: { group: 'Moderation', useAsTitle: 'summary', defaultColumns: ['summary', 'company', 'status', 'createdAt'], description: 'Changes a company asked for. Nothing goes live until an editor applies it to the company record.' },
  access: { read: roles('moderator', 'editor'), create: ({ req }) => Boolean(req.user), update: roles('moderator', 'editor'), delete: roles() },
  hooks,
  fields: [
    { type: 'row', fields: [{ name: 'company', type: 'relationship', relationTo: 'companies', required: true }, { name: 'user', type: 'relationship', relationTo: 'users' }] },
    { name: 'summary', type: 'text', required: true },
    { name: 'details', type: 'textarea', required: true },
    STATUS,
  ],
}

export const Reports: CollectionConfig = {
  slug: 'reports',
  labels: { singular: 'Report', plural: 'Reports & requests' },
  admin: { group: 'Moderation', useAsTitle: 'subject', defaultColumns: ['kind', 'subject', 'company', 'status', 'createdAt'], description: 'Data error reports, rating review requests and abuse reports on reviews.' },
  access: { read: roles('moderator', 'editor', 'analyst'), create: anyone, update: roles('moderator', 'editor', 'analyst'), delete: roles() },
  hooks,
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'kind',
          type: 'select',
          required: true,
          options: [
            { label: 'Data error', value: 'data_error' },
            { label: 'Rating review request', value: 'rating_review' },
            { label: 'Review abuse', value: 'review_abuse' },
          ],
        },
        STATUS,
      ],
    },
    { type: 'row', fields: [{ name: 'company', type: 'relationship', relationTo: 'companies' }, { name: 'review', type: 'relationship', relationTo: 'reviews' }] },
    { name: 'subject', type: 'text', required: true },
    { name: 'message', type: 'textarea' },
    { type: 'row', fields: [{ name: 'name', type: 'text' }, { name: 'email', type: 'email' }] },
  ],
}

export const Leads: CollectionConfig = {
  slug: 'leads',
  labels: { singular: 'Lead', plural: 'Leads & enquiries' },
  admin: { group: 'Sales', useAsTitle: 'name', defaultColumns: ['name', 'type', 'company', 'interest', 'status', 'assignedTo', 'createdAt'], description: 'Every form on the site lands here: call-back requests, contact and "Talk to us".' },
  access: {
    read: ({ req }) => {
      if (hasRole(req.user, 'sales')) return true
      if (req.user?.role === 'business') return { 'company.managers': { contains: req.user.id } }
      return false
    },
    create: anyone,
    update: roles('sales'),
    delete: roles(),
  },
  hooks,
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'type', type: 'select', required: true, options: [{ label: 'Call-back (Partner page)', value: 'callback' }, { label: 'Contact form', value: 'contact' }, { label: 'Talk to us (business)', value: 'business' }] },
        STATUS,
        { name: 'assignedTo', type: 'relationship', relationTo: 'users', filterOptions: { role: { in: ['sales', 'admin'] } } },
      ],
    },
    { name: 'company', type: 'relationship', relationTo: 'companies' },
    { type: 'row', fields: [{ name: 'name', type: 'text', required: true }, { name: 'contact', label: 'Email or phone', type: 'text', required: true }, { name: 'organisation', type: 'text' }] },
    { name: 'interest', type: 'text' },
    { name: 'message', type: 'textarea' },
    { name: 'consent', type: 'checkbox' },
  ],
}

export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  labels: { singular: 'Newsletter subscriber', plural: 'Newsletter' },
  admin: { group: 'Sales', useAsTitle: 'email' },
  access: { read: roles('sales', 'editor'), create: anyone, update: roles('sales'), delete: roles('sales') },
  fields: [{ name: 'email', type: 'email', required: true, unique: true }],
}

export const FeaturedSlots: CollectionConfig = {
  slug: 'featured-slots',
  labels: { singular: 'Featured slot', plural: 'Featured slots' },
  admin: { group: 'Sales', useAsTitle: 'label', defaultColumns: ['label', 'company', 'placement', 'start', 'end', 'active'], description: 'Paid placements. Always shown with a "Featured" label; they never change normal ranking.' },
  access: { read: anyone, create: roles('sales'), update: roles('sales'), delete: roles('sales') },
  hooks,
  fields: [
    { name: 'label', type: 'text', admin: { hidden: true }, hooks: { beforeChange: [({ siblingData }) => `${siblingData.placement ?? ''} slot`] } },
    { name: 'company', type: 'relationship', relationTo: 'companies', required: true, filterOptions: { tier: { equals: 'partner' } } },
    {
      type: 'row',
      fields: [
        { name: 'placement', type: 'select', required: true, options: [{ label: 'Homepage top rated', value: 'home' }, { label: 'Search results', value: 'search' }, { label: 'Category pages', value: 'category' }, { label: 'Similar companies', value: 'similar' }] },
        { name: 'category', type: 'relationship', relationTo: 'categories', admin: { description: 'Optional: only on this category.' } },
      ],
    },
    { type: 'row', fields: [{ name: 'start', type: 'date', required: true }, { name: 'end', type: 'date', required: true }, { name: 'active', type: 'checkbox', defaultValue: true }] },
  ],
}

export const AuditLog: CollectionConfig = {
  slug: 'audit-log',
  labels: { singular: 'Audit entry', plural: 'Audit log' },
  admin: { group: 'Settings', useAsTitle: 'docLabel', defaultColumns: ['createdAt', 'user', 'action', 'collectionSlug', 'docLabel', 'changedFields'], description: 'Who changed what, and when. Entries cannot be edited or deleted.' },
  access: { read: roles(), create: () => false, update: () => false, delete: () => false },
  defaultSort: '-createdAt',
  fields: [
    { type: 'row', fields: [{ name: 'action', type: 'text' }, { name: 'collectionSlug', label: 'Collection', type: 'text' }, { name: 'docId', type: 'text' }] },
    { name: 'docLabel', label: 'Record', type: 'text' },
    { name: 'changedFields', type: 'text' },
    { name: 'user', type: 'relationship', relationTo: 'users' },
  ],
}
