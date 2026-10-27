import type { CollectionConfig } from 'payload'

import { siteURL } from '../lib/site'

const isAdmin = ({ req }: { req: { user?: { role?: string } | null } }) =>
  req.user?.role === 'admin'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: {
    // New accounts must click a link in an email before they can sign in.
    verify: {
      generateEmailSubject: () => 'Confirm your BusinessLens demo account',
      generateEmailHTML: ({ token }) =>
        `<p>Welcome to the BusinessLens demo.</p>
         <p><a href="${siteURL()}/verify?token=${token}">Click here to confirm your email</a>.</p>`,
    },
    forgotPassword: {
      generateEmailSubject: () => 'Reset your BusinessLens demo password',
      generateEmailHTML: (args) =>
        `<p>Someone asked to reset your password.</p>
         <p><a href="${siteURL()}/reset-password?token=${args?.token}">Choose a new password</a>.</p>
         <p>If this wasn't you, ignore this email.</p>`,
    },
  },
  access: {
    // Only admins can open the admin panel at /admin.
    admin: isAdmin,
    create: () => true,
    read: ({ req }) => (req.user?.role === 'admin' ? true : req.user ? { id: { equals: req.user.id } } : false),
    update: ({ req }) => (req.user?.role === 'admin' ? true : req.user ? { id: { equals: req.user.id } } : false),
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === 'create') {
          // The very first account becomes the admin; everyone after that is a member.
          const { totalDocs } = await req.payload.count({ collection: 'users', req })
          if (totalDocs === 0) data.role = 'admin'
          else if (req.user?.role !== 'admin') data.role = 'member'
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text' },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'member',
      required: true,
      options: ['admin', 'member'],
      access: { update: ({ req }) => req.user?.role === 'admin' },
    },
  ],
}
