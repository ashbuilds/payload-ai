import type { Access, AccessArgs, Where } from 'payload'

/**
 * Organization-scoped access helpers.
 * These gracefully degrade to simple authenticated checks if the user does not carry an `organization` in their JWT.
 * Once your auth user includes an `organization` (id or populated), these will automatically scope by org.
 */

type OrgID = number | string | undefined

const getUserOrgId = (args: AccessArgs<any>): OrgID => {
  const user = args.req?.user as any
  // Support either a raw id or populated relation { id: string }
  return user?.organization?.id ?? user?.organization
}

const whereByOrg = (orgId: OrgID): Where => ({
  organization: {
    equals: orgId,
  },
})

/**
 * READ: If user has an org, return a where clause to scope by organization.
 * Otherwise, require authentication (returns boolean).
 */
export const orgReadAccess: Access = (args) => {
  const orgId = getUserOrgId(args)
  if (orgId) {
    return whereByOrg(orgId)
  }
  return Boolean(args.req?.user)
}

/**
 * CREATE: Require authentication. If both user org and payload `data.organization` exist, enforce they match.
 * If user has an org but data does not specify, allow create (server-side hooks/validators can enforce later if desired).
 */
export const orgCreateAccess: Access = (args) => {
  const { data, req } = args
  if (!req?.user) {
    return false
  }

  const userOrgId = getUserOrgId(args)
  const dataOrgId = data?.organization

  if (userOrgId && dataOrgId) {
    return String(userOrgId) === String(dataOrgId)
  }

  return true
}

/**
 * UPDATE: Scope by organization when available, else require authentication.
 */
export const orgUpdateAccess: Access = (args) => {
  const orgId = getUserOrgId(args)
  if (orgId) {
    return whereByOrg(orgId)
  }
  return Boolean(args.req?.user)
}

/**
 * DELETE: Scope by organization when available, else require authentication.
 */
export const orgDeleteAccess: Access = (args) => {
  const orgId = getUserOrgId(args)
  if (orgId) {
    return whereByOrg(orgId)
  }
  return Boolean(args.req?.user)
}
