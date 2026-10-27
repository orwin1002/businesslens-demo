import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import { seed } from '../seed'

// Adds the made-up demo firms once, the first time the site starts on a new database.
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  await seed(payload, req)
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  await payload.delete({ collection: 'firms', where: { id: { exists: true } }, req })
}
