import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import type { AdminViewServerProps } from 'payload'

import { hasRole } from '@/access'
import { ImportClient } from './ImportClient'

export function ImportView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const user = initPageResult.req.user
  return (
    <DefaultTemplate
      i18n={initPageResult.req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={initPageResult.req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={user || undefined}
      visibleEntities={initPageResult.visibleEntities}
    >
      <Gutter>
        <h1 style={{ marginTop: 24 }}>Import from Excel</h1>
        {hasRole(user, 'editor') ? <ImportClient /> : <p>Only admins and editors can import data.</p>}
      </Gutter>
    </DefaultTemplate>
  )
}
