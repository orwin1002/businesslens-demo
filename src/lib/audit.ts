import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

// Writes one line to the audit log for every change made by a person (brief 9.3 "Audit log").
const label = (doc: Record<string, unknown>) =>
  String(doc.legalName ?? doc.name ?? doc.title ?? doc.email ?? doc.licenceNumber ?? doc.id)

export const auditChange: CollectionAfterChangeHook = async ({ collection, doc, previousDoc, operation, req }) => {
  if (req.context?.import || req.context?.skipAudit || collection.slug === 'audit-log') return doc
  const changed =
    operation === 'update' && previousDoc
      ? Object.keys(doc).filter(
          (k) => !['updatedAt', 'createdAt', '_status'].includes(k) && JSON.stringify(doc[k]) !== JSON.stringify(previousDoc[k]),
        )
      : []
  try {
    await req.payload.create({
      collection: 'audit-log',
      data: {
        action: operation,
        collectionSlug: collection.slug,
        docId: String(doc.id),
        docLabel: label(doc),
        changedFields: changed.join(', '),
        user: req.user?.id ?? null,
      },
      req,
      overrideAccess: true,
      context: { skipAudit: true },
    })
  } catch (err) {
    req.payload.logger.error({ err, msg: 'Audit log write failed' })
  }
  return doc
}

export const auditDelete: CollectionAfterDeleteHook = async ({ collection, doc, req }) => {
  if (req.context?.import || collection.slug === 'audit-log') return
  await req.payload.create({
    collection: 'audit-log',
    data: { action: 'delete', collectionSlug: collection.slug, docId: String(doc.id), docLabel: label(doc), user: req.user?.id ?? null },
    req,
    overrideAccess: true,
    context: { skipAudit: true },
  })
}

export const audited = { afterChange: [auditChange], afterDelete: [auditDelete] }
