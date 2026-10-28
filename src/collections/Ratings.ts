import type { CollectionConfig } from 'payload'

import { hasRole, roles } from '../access'
import { auditChange, auditDelete } from '../lib/audit'
import { bandFor, overallFrom, RATING_STATES, type Band } from '../lib/rating'

const id = (v: unknown) => (typeof v === 'object' && v ? (v as { id: number }).id : (v as number))

export const Ratings: CollectionConfig = {
  slug: 'ratings',
  admin: {
    group: 'Ratings',
    useAsTitle: 'title',
    defaultColumns: ['title', 'company', 'overall', 'band', 'state', 'status', 'publishedAt', 'analyst'],
    description: 'Only Analysts can create, edit or publish a rating. Every published rating becomes a public history entry.',
  },
  versions: { maxPerDoc: 30 },
  access: {
    read: ({ req }) => hasRole(req.user, 'analyst', 'editor', 'moderator', 'sales'),
    create: roles('analyst'),
    update: roles('analyst'),
    delete: roles(),
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        // Fill the criteria from the methodology, then calculate total and band.
        const methodologyId = id(data.methodology ?? originalDoc?.methodology)
        const methodology = methodologyId
          ? await req.payload.findByID({ collection: 'methodologies', id: methodologyId, req, depth: 0 })
          : null
        if (methodology && (!data.scores || data.scores.length === 0)) {
          data.scores = (methodology.criteria ?? []).map((c) => ({ criterion: c.name, max: c.maxPoints, score: null }))
        }
        const scores = (data.scores ?? []).map((s: { criterion: string; max: number; score?: number | null }) => ({
          ...s,
          score: s.score == null ? s.score : Math.max(0, Math.min(Number(s.score), Number(s.max))),
        }))
        data.scores = scores
        data.overall = overallFrom(scores)
        const band = bandFor(data.overall, (methodology?.bands as Band[] | undefined) ?? undefined)
        data.band = band?.label
        data.bandColor = band?.color
        data.methodologyVersion = methodology ? `${methodology.title} v${methodology.version}` : data.methodologyVersion
        if (operation === 'create' && req.user) data.analyst = req.user.id
        const company = await req.payload.findByID({ collection: 'companies', id: id(data.company ?? originalDoc?.company), req, depth: 0 })
        data.title = `${company.legalName} · ${data.overall.toFixed(1)}`
        if (data.status === 'published' && originalDoc?.status !== 'published') data.publishedAt = data.publishedAt ?? new Date().toISOString()
        return data
      },
    ],
    afterChange: [
      auditChange,
      async ({ doc, previousDoc, req }) => {
        // Publishing is the only way a score reaches the company page.
        if (doc.status !== 'published' || previousDoc?.status === 'published') return doc
        const companyId = id(doc.company)
        const data: Record<string, unknown> = { ratingState: doc.state, ratingNote: doc.publicNote || null }
        if (doc.state === 'rated') {
          Object.assign(data, {
            ratingOverall: doc.overall,
            ratingBand: doc.band,
            ratingColor: doc.bandColor,
            ratingDate: doc.publishedAt,
            ratingMethodology: doc.methodologyVersion,
            ratingScores: (doc.scores ?? []).map((s: { criterion: string; max: number; score?: number; shareableNote?: string }) => ({
              criterion: s.criterion,
              max: s.max,
              score: s.score ?? 0,
            })),
          })
        }
        if (doc.state === 'suspended' || doc.state === 'not_rated') Object.assign(data, { ratingOverall: null, ratingBand: null })
        await req.payload.update({ collection: 'companies', id: companyId, data, req, overrideAccess: true, context: { system: true } })
        return doc
      },
    ],
    afterDelete: [auditDelete],
  },
  fields: [
    { name: 'title', type: 'text', admin: { hidden: true } },
    {
      type: 'row',
      fields: [
        { name: 'company', type: 'relationship', relationTo: 'companies', required: true, index: true, admin: { width: '50%' } },
        { name: 'methodology', type: 'relationship', relationTo: 'methodologies', required: true, admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'status',
          label: 'Workflow',
          type: 'select',
          defaultValue: 'draft',
          required: true,
          options: [
            { label: 'Draft', value: 'draft' },
            { label: 'In review', value: 'in_review' },
            { label: 'Published', value: 'published' },
          ],
        },
        { name: 'state', label: 'Rating state', type: 'select', defaultValue: 'rated', required: true, options: RATING_STATES },
      ],
    },
    {
      name: 'scores',
      label: 'Criteria',
      type: 'array',
      admin: { description: 'Filled from the methodology when you save the first time. Total and band are calculated.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'criterion', type: 'text', required: true, admin: { readOnly: true, width: '40%' } },
            { name: 'max', type: 'number', required: true, admin: { readOnly: true, width: '15%' } },
            { name: 'score', type: 'number', min: 0, admin: { width: '15%' } },
          ],
        },
        { type: 'row', fields: [{ name: 'internalNote', type: 'textarea', admin: { width: '50%' } }, { name: 'shareableNote', label: 'Shareable note (company sees it)', type: 'textarea', admin: { width: '50%' } }] },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'overall', label: 'Total /10 (calculated)', type: 'number', admin: { readOnly: true } },
        { name: 'band', type: 'text', admin: { readOnly: true } },
        { name: 'bandColor', type: 'text', admin: { hidden: true } },
        { name: 'methodologyVersion', type: 'text', admin: { readOnly: true } },
      ],
    },
    { name: 'reason', label: 'Reason for change', type: 'text', required: true },
    { name: 'publicNote', label: 'Public note (for Under review / Suspended)', type: 'text' },
    {
      type: 'row',
      fields: [
        { name: 'analyst', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
        { name: 'publishedAt', type: 'date', admin: { readOnly: true } },
      ],
    },
  ],
}
