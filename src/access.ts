import type { Access, FieldAccess, PayloadRequest } from 'payload'

// Staff roles from the brief (section 9.3), plus public members and company users.
export const STAFF_ROLES = ['admin', 'analyst', 'editor', 'moderator', 'sales'] as const
export type Role = (typeof STAFF_ROLES)[number] | 'member' | 'business'

type MaybeUser = { role?: string | null } | null | undefined

export const hasRole = (user: MaybeUser, ...roles: string[]) =>
  Boolean(user?.role && (user.role === 'admin' || roles.includes(user.role)))

export const isStaffUser = (user: MaybeUser) =>
  Boolean(user?.role && (STAFF_ROLES as readonly string[]).includes(user.role))

// Collection-level helpers.
export const roles =
  (...r: string[]): Access =>
  ({ req }) =>
    hasRole(req.user, ...r)
export const staff: Access = ({ req }) => isStaffUser(req.user)
export const anyone: Access = () => true
export const signedIn: Access = ({ req }) => Boolean(req.user)
export const nobody: Access = () => false

// Field-level helpers.
export const fieldRoles =
  (...r: string[]): FieldAccess =>
  ({ req }) =>
    hasRole(req.user, ...r)
export const fieldNobody: FieldAccess = () => false

export const isImport = (req: PayloadRequest) => Boolean(req.context?.import)
