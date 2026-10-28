import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import { seedDemo } from '../seed'

// Adds the taxonomy, regulators, methodology, CMS pages and made-up example companies.
// The real firms are added afterwards through Admin > Import from Excel.
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  await seedDemo(payload, req)
}

export async function down(_args: MigrateDownArgs): Promise<void> {}
