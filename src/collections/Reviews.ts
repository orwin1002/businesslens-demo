import type { CollectionConfig, Where } from 'payload'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'firm', 'rating', 'status', 'author'],
  },
  access: {
    // The public sees approved reviews; members also see their own; admins see all.
    read: ({ req }): boolean | Where => {
      if (req.user?.role === 'admin') return true
      if (req.user)
        return { or: [{ status: { equals: 'approved' } }, { author: { equals: req.user.id } }] }
      return { status: { equals: 'approved' } }
    },
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  hooks: {
    beforeChange: [
      ({ data, operation, req }) => {
        if (operation === 'create' && req.user?.role !== 'admin') {
          // Members can't pick the author or approve their own review.
          data.author = req.user?.id
          data.status = 'pending'
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, operation, previousDoc, req }) => {
        const author =
          typeof doc.author === 'object'
            ? doc.author
            : await req.payload.findByID({ collection: 'users', id: doc.author, req })
        if (!author?.email) return doc
        try {
          if (operation === 'create') {
            await req.payload.sendEmail({
              to: author.email,
              subject: 'We received your review',
              html: `<p>Thanks for your review "${doc.title}". It will appear once a moderator approves it.</p>`,
            })
          } else if (previousDoc?.status !== 'approved' && doc.status === 'approved') {
            await req.payload.sendEmail({
              to: author.email,
              subject: 'Your review is live',
              html: `<p>Your review "${doc.title}" has been approved and is now public.</p>`,
            })
          }
        } catch (err) {
          req.payload.logger.error({ err, msg: 'Could not send review email' })
        }
        return doc
      },
    ],
  },
  fields: [
    { name: 'firm', type: 'relationship', relationTo: 'firms', required: true },
    { name: 'author', type: 'relationship', relationTo: 'users', required: true },
    { name: 'rating', type: 'number', min: 1, max: 5, required: true },
    { name: 'title', type: 'text', required: true },
    { name: 'body', type: 'textarea', required: true },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      required: true,
      options: ['pending', 'approved', 'rejected'],
      admin: { position: 'sidebar' },
    },
  ],
}
