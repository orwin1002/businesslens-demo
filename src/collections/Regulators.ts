import type { CollectionConfig } from 'payload'

import { anyone, roles } from '../access'
import { audited } from '../lib/audit'

export const Regulators: CollectionConfig = {
  slug: 'regulators',
  admin: { group: 'Taxonomy', useAsTitle: 'code', defaultColumns: ['code', 'name', 'country', 'order'] },
  access: { read: anyone, create: roles('editor'), update: roles('editor'), delete: roles() },
  hooks: audited,
  defaultSort: 'order',
  fields: [
    { type: 'row', fields: [{ name: 'code', type: 'text', required: true, unique: true }, { name: 'slug', type: 'text', required: true, unique: true }, { name: 'country', type: 'text', maxLength: 2 }, { name: 'order', type: 'number', defaultValue: 100 }] },
    { name: 'name', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    { type: 'row', fields: [{ name: 'registerUrl', type: 'text' }, { name: 'alertsUrl', type: 'text' }] },
    { name: 'registerLastChecked', type: 'date' },
  ],
}
