import type { CollectionConfig } from 'payload'

import { anyone, roles } from '../access'
import { audited } from '../lib/audit'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Category', plural: 'Categories' },
  admin: { group: 'Taxonomy', useAsTitle: 'name', defaultColumns: ['name', 'parent', 'slug', 'order'], description: 'Main categories have no parent; sub-categories point to their main category.' },
  access: { read: anyone, create: roles('editor'), update: roles('editor'), delete: roles() },
  hooks: audited,
  defaultSort: 'order',
  fields: [
    { type: 'row', fields: [{ name: 'name', type: 'text', required: true }, { name: 'slug', type: 'text', required: true, unique: true }, { name: 'order', type: 'number', defaultValue: 100 }] },
    { name: 'parent', type: 'relationship', relationTo: 'categories', filterOptions: { parent: { exists: false } } },
    { name: 'intro', label: 'Intro text for the category page', type: 'textarea' },
    { name: 'laterPhase', label: 'Later phase (hidden from menus)', type: 'checkbox' },
  ],
}
