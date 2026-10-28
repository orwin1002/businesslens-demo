import type { CollectionConfig } from 'payload'

import { anyone, fieldNobody, fieldRoles, hasRole, roles } from '../access'
import { auditChange, auditDelete } from '../lib/audit'
import { slugify } from '../lib/format'
import { RATING_STATES } from '../lib/rating'
import { reindexCompanies, removeCompany } from '../lib/search'

const readOnlyRating = { access: { create: fieldNobody, update: fieldNobody }, admin: { readOnly: true } }

export const Companies: CollectionConfig = {
  slug: 'companies',
  labels: { singular: 'Company', plural: 'Companies' },
  admin: {
    group: 'Directory',
    useAsTitle: 'legalName',
    defaultColumns: ['legalName', 'primaryCategory', 'hqCountry', 'tier', 'ratingState', 'ratingOverall', 'updatedAt'],
    listSearchableFields: ['legalName', 'entityId', 'lei', 'website'],
    description: 'Every institution in the directory. Ratings are read-only here: analysts set them in Ratings.',
    pagination: { defaultLimit: 25 },
  },
  versions: { maxPerDoc: 50 },
  access: {
    read: anyone,
    create: roles('editor', 'sales'),
    update: roles('editor', 'sales'),
    delete: roles(),
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && !data.slug && data.legalName) data.slug = slugify(data.legalName)
        return data
      },
    ],
    beforeChange: [
      ({ data, req, operation }) => {
        // Remember when staff edit a record, so a later import doesn't overwrite their work.
        if (operation === 'update' && !req.context?.import && !req.context?.system) data.editedSinceImport = true
        return data
      },
    ],
    afterChange: [
      auditChange,
      async ({ doc, req }) => {
        if (req.context?.import) return doc
        try {
          await reindexCompanies(req.payload, [doc.id])
        } catch (err) {
          req.payload.logger.error({ err, msg: 'Search index update failed' })
        }
        return doc
      },
    ],
    afterDelete: [auditDelete, async ({ doc }) => removeCompany(doc.id).catch(() => undefined)],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'legalName', type: 'text', required: true, admin: { width: '50%' } },
        { name: 'slug', type: 'text', required: true, unique: true, index: true, admin: { width: '25%' } },
        { name: 'entityId', label: 'Entity ID', type: 'text', unique: true, index: true, admin: { width: '25%' } },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Profile',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'primaryCategory', type: 'relationship', relationTo: 'categories', filterOptions: { parent: { exists: false } }, admin: { width: '50%' } },
                { name: 'subCategories', type: 'relationship', relationTo: 'categories', hasMany: true, filterOptions: { parent: { exists: true } }, admin: { width: '50%' } },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'hqCountry', label: 'HQ country (ISO code)', type: 'text', maxLength: 2, admin: { width: '25%' } },
                { name: 'website', type: 'text', admin: { width: '50%' } },
                { name: 'groupId', label: 'Group ID', type: 'text', index: true, admin: { width: '25%' } },
              ],
            },
            { name: 'shortDescription', label: 'About (neutral, about 120 words)', type: 'textarea' },
            { name: 'brandNames', type: 'array', labels: { singular: 'Brand', plural: 'Brand names' }, fields: [{ name: 'name', type: 'text', required: true }] },
            { name: 'formerNames', type: 'array', fields: [{ name: 'name', type: 'text', required: true }] },
            { name: 'operatingCountries', type: 'array', fields: [{ name: 'code', type: 'text', maxLength: 2, required: true }] },
          ],
        },
        {
          label: 'Key facts',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'lei', label: 'LEI', type: 'text', index: true },
                { name: 'yearFounded', type: 'number' },
                { name: 'employeeRange', type: 'text' },
                { name: 'minDepositUsd', label: 'Min. deposit (USD)', type: 'number' },
              ],
            },
            { name: 'registeredAddress', type: 'textarea' },
            { name: 'officeLocations', type: 'text' },
            { name: 'keyPeople', type: 'text', admin: { description: 'Public senior names and roles only.' } },
            { name: 'productsServices', type: 'textarea' },
            { name: 'platforms', type: 'text' },
            { type: 'row', fields: [{ name: 'clientTypes', type: 'text' }, { name: 'languages', type: 'text' }, { name: 'arabicWebsite', type: 'checkbox' }] },
            { type: 'row', fields: [{ name: 'publicEmail', type: 'text' }, { name: 'phone', type: 'text' }, { name: 'socialLinks', type: 'text' }] },
          ],
        },
        {
          label: 'Licences',
          fields: [
            {
              name: 'licences',
              type: 'join',
              collection: 'licences',
              on: 'company',
              admin: { defaultColumns: ['regulator', 'licenceNumber', 'licenceType', 'status', 'dateChecked'] },
            },
          ],
        },
        {
          label: 'Tier & Partner content',
          description: 'Tier is managed by Sales. It changes layout and tools only, never the rating.',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'tier',
                  type: 'select',
                  defaultValue: 'standard',
                  required: true,
                  options: [
                    { label: 'Standard', value: 'standard' },
                    { label: 'Claimed', value: 'claimed' },
                    { label: 'Partner', value: 'partner' },
                  ],
                  access: { update: fieldRoles('sales'), create: fieldRoles('sales') },
                },
                { name: 'tierStart', type: 'date', access: { update: fieldRoles('sales') } },
                { name: 'tierEnd', type: 'date', access: { update: fieldRoles('sales') } },
              ],
            },
            { name: 'managers', label: 'Company users', type: 'relationship', relationTo: 'users', hasMany: true },
            { type: 'row', fields: [{ name: 'logoUrl', label: 'Logo URL', type: 'text' }, { name: 'bannerUrl', label: 'Banner URL', type: 'text' }] },
            { name: 'extendedAbout', label: 'Extended about (Partner)', type: 'textarea' },
            { name: 'videoUrl', label: 'Video URL (YouTube)', type: 'text' },
            { type: 'row', fields: [{ name: 'ctaLabel', label: 'Main button label', type: 'text' }, { name: 'ctaUrl', label: 'Main button URL', type: 'text' }] },
            {
              type: 'collapsible',
              label: 'Products & services (Partner tabs)',
              fields: [
                { name: 'accounts', type: 'textarea' },
                { name: 'instruments', type: 'textarea' },
                { name: 'platformsDetail', label: 'Platforms', type: 'textarea' },
                { name: 'fees', type: 'textarea' },
              ],
            },
            {
              name: 'team',
              labels: { singular: 'Person', plural: 'Leadership team' },
              type: 'array',
              fields: [
                { type: 'row', fields: [{ name: 'name', type: 'text', required: true }, { name: 'role', type: 'text' }, { name: 'photoUrl', type: 'text' }] },
                { name: 'bio', type: 'textarea' },
              ],
            },
            {
              name: 'offices',
              type: 'array',
              fields: [
                { type: 'row', fields: [{ name: 'city', type: 'text', required: true }, { name: 'country', type: 'text' }, { name: 'address', type: 'text' }] },
                { type: 'row', fields: [{ name: 'lat', type: 'number' }, { name: 'lng', type: 'number' }] },
              ],
            },
            {
              name: 'news',
              type: 'array',
              fields: [
                { type: 'row', fields: [{ name: 'title', type: 'text', required: true }, { name: 'date', type: 'date' }] },
                { name: 'summary', type: 'textarea' },
              ],
            },
            { name: 'documents', type: 'array', fields: [{ type: 'row', fields: [{ name: 'title', type: 'text', required: true }, { name: 'url', type: 'text', required: true }] }] },
          ],
        },
        {
          label: 'Rating (read-only)',
          description: 'Set by publishing a rating in Ratings. Nobody can type a score here, and tier has no link to it.',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'ratingState', type: 'select', defaultValue: 'not_rated', options: RATING_STATES, ...readOnlyRating },
                { name: 'ratingOverall', label: 'Overall /10', type: 'number', ...readOnlyRating },
                { name: 'ratingBand', type: 'text', ...readOnlyRating },
                { name: 'ratingColor', type: 'text', ...readOnlyRating, admin: { readOnly: true, hidden: true } },
                { name: 'ratingDate', type: 'date', ...readOnlyRating },
              ],
            },
            { name: 'ratingNote', label: 'Public note (state explanation)', type: 'text', ...readOnlyRating },
            { name: 'ratingMethodology', type: 'text', ...readOnlyRating },
            { name: 'ratingScores', type: 'json', ...readOnlyRating },
            {
              type: 'row',
              fields: [
                { name: 'reviewCount', type: 'number', defaultValue: 0, ...readOnlyRating },
                { name: 'reviewAverage', label: 'Community score', type: 'number', ...readOnlyRating },
                { name: 'alertActive', type: 'checkbox', ...readOnlyRating },
              ],
            },
            { name: 'ratings', type: 'join', collection: 'ratings', on: 'company' },
          ],
        },
        {
          label: 'Data quality',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'priority', type: 'number', min: 1, max: 5 },
                { name: 'confidence', type: 'select', options: ['High', 'Medium', 'Low'] },
                { name: 'warningFlag', type: 'checkbox' },
                { name: 'dateVerified', type: 'date' },
              ],
            },
            { name: 'listedOn', type: 'text' },
            { name: 'sources', type: 'textarea' },
            { name: 'notes', label: 'Internal notes', type: 'textarea', access: { read: ({ req }) => hasRole(req.user, 'editor', 'analyst', 'moderator', 'sales') } },
            {
              type: 'row',
              fields: [
                { name: 'isExample', label: 'Made-up example company', type: 'checkbox' },
                { name: 'archived', type: 'checkbox' },
                { name: 'editedSinceImport', type: 'checkbox', admin: { readOnly: true } },
                { name: 'lastImportedAt', type: 'date', admin: { readOnly: true } },
              ],
            },
          ],
        },
      ],
    },
  ],
}
