import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Categories } from './collections/Categories'
import { Companies } from './collections/Companies'
import { Alerts, Home, Insights, Pages } from './collections/Content'
import { Licences } from './collections/Licences'
import { Methodologies } from './collections/Methodologies'
import { AuditLog, Claims, EditRequests, FeaturedSlots, Leads, Reports, Subscribers } from './collections/Queues'
import { Ratings } from './collections/Ratings'
import { Regulators } from './collections/Regulators'
import { Reviews } from './collections/Reviews'
import { Users } from './collections/Users'
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const smtpPort = Number(process.env.SMTP_PORT || 587)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: { titleSuffix: ' · BusinessLens admin' },
    components: {
      graphics: { Logo: '/components/admin/Brand#Logo', Icon: '/components/admin/Brand#Icon' },
      beforeDashboard: ['/components/admin/Dashboard#Dashboard'],
      afterNavLinks: ['/components/admin/NavImport#NavLinks'],
      views: {
        import: { Component: '/components/admin/ImportView#ImportView', path: '/import' },
      },
    },
  },
  collections: [
    Companies, Licences, Categories, Regulators,
    Ratings, Methodologies,
    Reviews, Claims, EditRequests, Reports,
    Leads, FeaturedSlots, Subscribers,
    Insights, Pages, Alerts,
    Users, AuditLog,
  ],
  globals: [Home],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    prodMigrations: migrations,
  }),
  // Without SMTP settings, emails are printed to the server log instead of sent.
  email: process.env.SMTP_HOST
    ? nodemailerAdapter({
        defaultFromAddress: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        defaultFromName: 'BusinessLens',
        transportOptions: {
          host: process.env.SMTP_HOST,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
        },
      })
    : undefined,
  sharp,
  plugins: [],
})
