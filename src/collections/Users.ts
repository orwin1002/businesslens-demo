import type { CollectionConfig } from 'payload'

import { hasRole, isStaffUser } from '../access'
import { auditChange } from '../lib/audit'
import { siteURL } from '../lib/site'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    group: 'Settings',
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'role', 'createdAt'],
    description: 'Staff, reviewers and company users. Roles decide what each person can see and change.',
  },
  auth: {
    verify: {
      generateEmailSubject: () => 'Confirm your BusinessLens account',
      generateEmailHTML: ({ token }) =>
        `<p>Welcome to BusinessLens.</p><p><a href="${siteURL()}/verify?token=${token}">Click here to confirm your email</a>.</p>`,
    },
    forgotPassword: {
      generateEmailSubject: () => 'Reset your BusinessLens password',
      generateEmailHTML: (args) =>
        `<p>Someone asked to reset your password.</p><p><a href="${siteURL()}/reset-password?token=${args?.token}">Choose a new password</a>.</p><p>If this wasn't you, ignore this email.</p>`,
    },
  },
  access: {
    admin: ({ req }) => isStaffUser(req.user),
    create: () => true,
    read: ({ req }) => (hasRole(req.user) ? true : req.user ? { id: { equals: req.user.id } } : false),
    update: ({ req }) => (hasRole(req.user) ? true : req.user ? { id: { equals: req.user.id } } : false),
    delete: ({ req }) => hasRole(req.user),
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === 'create') {
          // The very first account becomes the super admin; everyone else signs up as a member.
          const { totalDocs } = await req.payload.count({ collection: 'users', req })
          if (totalDocs === 0) data.role = 'admin'
          else if (!hasRole(req.user) && !req.context?.system) data.role = 'member'
        }
        return data
      },
    ],
    afterChange: [auditChange],
  },
  fields: [
    { name: 'name', type: 'text' },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'member',
      required: true,
      options: [
        { label: 'Super admin', value: 'admin' },
        { label: 'Analyst (ratings)', value: 'analyst' },
        { label: 'Editor (profiles and content)', value: 'editor' },
        { label: 'Moderator (reviews and claims)', value: 'moderator' },
        { label: 'Sales (tiers, leads)', value: 'sales' },
        { label: 'Company user', value: 'business' },
        { label: 'Member (reviewer)', value: 'member' },
      ],
      access: { update: ({ req }) => hasRole(req.user) },
    },
  ],
}
