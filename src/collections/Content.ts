import type { CollectionConfig, GlobalConfig } from 'payload'

import { anyone, roles } from '../access'
import { audited } from '../lib/audit'

const publishedOrStaff = ({ req }: { req: { user?: { role?: string | null } | null } }) =>
  req.user && req.user.role !== 'member' && req.user.role !== 'business' ? true : { publishedAt: { exists: true } }

export const Insights: CollectionConfig = {
  slug: 'insights',
  labels: { singular: 'Insight', plural: 'Insights' },
  admin: { group: 'Content', useAsTitle: 'title', defaultColumns: ['title', 'publishedAt', 'updatedAt'] },
  access: { read: publishedOrStaff, create: roles('editor'), update: roles('editor'), delete: roles('editor') },
  hooks: audited,
  fields: [
    { name: 'title', type: 'text', required: true },
    { type: 'row', fields: [{ name: 'slug', type: 'text', required: true, unique: true }, { name: 'publishedAt', type: 'date' }, { name: 'author', type: 'text', defaultValue: 'BusinessLens Research' }] },
    { name: 'excerpt', type: 'textarea' },
    { name: 'body', type: 'richText' },
    { name: 'metaTitle', type: 'text' },
    { name: 'metaDescription', type: 'textarea' },
  ],
}

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: { group: 'Content', useAsTitle: 'title', defaultColumns: ['title', 'slug', 'updatedAt'], description: 'Legal, trust and about pages. Text to be supplied by BusinessLens.' },
  access: { read: anyone, create: roles('editor'), update: roles('editor'), delete: roles('editor') },
  hooks: audited,
  fields: [
    { type: 'row', fields: [{ name: 'title', type: 'text', required: true }, { name: 'slug', type: 'text', required: true, unique: true }] },
    { name: 'body', type: 'richText' },
    { name: 'metaDescription', type: 'textarea' },
  ],
}

export const Alerts: CollectionConfig = {
  slug: 'alerts',
  admin: { group: 'Content', useAsTitle: 'title', defaultColumns: ['title', 'regulator', 'company', 'date', 'active'], description: 'Regulator warnings and BusinessLens notices. An active alert puts a red banner on the company page.' },
  access: { read: anyone, create: roles('editor', 'analyst'), update: roles('editor', 'analyst'), delete: roles('editor') },
  hooks: {
    ...audited,
    afterChange: [
      ...audited.afterChange,
      async ({ doc, req }) => {
        const companyId = typeof doc.company === 'object' ? doc.company?.id : doc.company
        if (!companyId) return doc
        const { totalDocs } = await req.payload.count({ collection: 'alerts', where: { company: { equals: companyId }, active: { equals: true } }, req })
        await req.payload.update({ collection: 'companies', id: companyId, data: { alertActive: totalDocs > 0 }, req, overrideAccess: true, context: { system: true } })
        return doc
      },
    ],
  },
  defaultSort: '-date',
  fields: [
    { name: 'title', type: 'text', required: true },
    { type: 'row', fields: [{ name: 'kind', type: 'select', defaultValue: 'regulator', options: [{ label: 'Regulator warning', value: 'regulator' }, { label: 'BusinessLens notice', value: 'notice' }] }, { name: 'date', type: 'date', required: true }, { name: 'active', type: 'checkbox', defaultValue: true }] },
    { type: 'row', fields: [{ name: 'regulator', type: 'relationship', relationTo: 'regulators' }, { name: 'company', type: 'relationship', relationTo: 'companies' }] },
    { name: 'namedEntity', label: 'Name as published in the warning', type: 'text' },
    { name: 'summary', type: 'textarea' },
    { name: 'officialUrl', label: 'Official alert URL', type: 'text' },
  ],
}

export const Home: GlobalConfig = {
  slug: 'home',
  label: 'Homepage',
  admin: { group: 'Content' },
  access: { read: anyone, update: roles('editor') },
  fields: [
    { name: 'headline', type: 'text', defaultValue: 'Know who you are trusting with your money.' },
    { name: 'subline', type: 'textarea', defaultValue: 'Independent ratings, verified licences and real reviews for brokers, banks, custodians, funds and fintechs across the Middle East and beyond.' },
    { name: 'popularSearches', type: 'array', fields: [{ type: 'row', fields: [{ name: 'label', type: 'text', required: true }, { name: 'href', type: 'text', required: true }] }] },
    { name: 'institutionsTitle', type: 'text', defaultValue: 'Are you a financial institution?' },
    { name: 'institutionsText', type: 'textarea', defaultValue: 'Claim your free profile, see your rating breakdown and learn how to improve it.' },
  ],
}
