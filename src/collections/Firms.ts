import type { CollectionConfig } from 'payload'

import { indexFirms, removeFirm } from '../lib/search'

export const Firms: CollectionConfig = {
  slug: 'firms',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'regulator', 'licenceNumber', 'country'],
  },
  access: {
    read: () => true,
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  hooks: {
    // Keep the search engine in step with the database.
    afterChange: [
      async ({ doc, req }) => {
        try {
          await indexFirms([doc])
        } catch (err) {
          req.payload.logger.error({ err, msg: 'Could not update search index' })
        }
        return doc
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        try {
          await removeFirm(doc.id)
        } catch (err) {
          req.payload.logger.error({ err, msg: 'Could not remove firm from search index' })
        }
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'regulator', type: 'text' },
    { name: 'licenceNumber', type: 'text' },
    { name: 'country', type: 'text' },
    { name: 'category', type: 'text' },
    { name: 'website', type: 'text' },
    { name: 'description', type: 'textarea' },
  ],
}
