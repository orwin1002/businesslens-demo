import type { CollectionConfig } from 'payload'

import { anyone, roles } from '../access'
import { audited } from '../lib/audit'

export const Methodologies: CollectionConfig = {
  slug: 'methodologies',
  admin: {
    group: 'Ratings',
    useAsTitle: 'title',
    defaultColumns: ['title', 'version', 'isDefault', 'updatedAt'],
    description: 'Criteria, maximum points and score bands. Each rating stores the version it used.',
  },
  access: { read: anyone, create: roles('analyst'), update: roles('analyst'), delete: roles() },
  hooks: audited,
  fields: [
    { type: 'row', fields: [{ name: 'title', type: 'text', required: true }, { name: 'version', type: 'text', required: true }, { name: 'isDefault', type: 'checkbox' }] },
    { name: 'categories', label: 'Used for categories (empty = all others)', type: 'relationship', relationTo: 'categories', hasMany: true },
    {
      name: 'criteria',
      type: 'array',
      minRows: 1,
      fields: [
        { type: 'row', fields: [{ name: 'name', type: 'text', required: true }, { name: 'maxPoints', type: 'number', required: true }] },
        { name: 'description', type: 'textarea' },
      ],
    },
    {
      name: 'bands',
      type: 'array',
      admin: { description: 'A score at or above "min score" gets that band.' },
      fields: [{ type: 'row', fields: [{ name: 'label', type: 'text', required: true }, { name: 'minScore', type: 'number', required: true }, { name: 'color', type: 'text', required: true }] }],
    },
  ],
}
