import type { CollectionConfig } from 'payload'

import { anyone, roles } from '../access'
import { auditChange, auditDelete } from '../lib/audit'
import { reindexCompanies } from '../lib/search'

const companyId = (c: unknown) => (typeof c === 'object' && c ? (c as { id: number }).id : (c as number))

export const Licences: CollectionConfig = {
  slug: 'licences',
  admin: {
    group: 'Directory',
    useAsTitle: 'licenceNumber',
    defaultColumns: ['licenceNumber', 'company', 'regulator', 'licenceType', 'status', 'dateChecked'],
  },
  access: { read: anyone, create: roles('editor'), update: roles('editor'), delete: roles('editor') },
  hooks: {
    afterChange: [
      auditChange,
      async ({ doc, req }) => {
        if (!req.context?.import) await reindexCompanies(req.payload, [companyId(doc.company)]).catch(() => undefined)
        return doc
      },
    ],
    afterDelete: [auditDelete],
  },
  fields: [
    { type: 'row', fields: [{ name: 'company', type: 'relationship', relationTo: 'companies', required: true, index: true }, { name: 'regulator', type: 'relationship', relationTo: 'regulators', required: true, index: true }] },
    {
      type: 'row',
      fields: [
        { name: 'licenceNumber', type: 'text', required: true, index: true },
        { name: 'jurisdiction', type: 'text', maxLength: 2 },
        { name: 'status', type: 'select', defaultValue: 'Active', options: ['Active', 'Suspended', 'Withdrawn', 'Unknown'] },
      ],
    },
    { name: 'licenceType', label: 'Licence type / activities', type: 'textarea' },
    { type: 'row', fields: [{ name: 'dateGranted', type: 'date' }, { name: 'dateChecked', type: 'date' }] },
    { name: 'registerUrl', label: 'Official register URL', type: 'text' },
  ],
}
