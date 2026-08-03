import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext, loadOrgPermissions } from '@/features/auth'
import { bulkRestore, bulkOperationBodySchema } from '@/features/resource'
export const POST = withErrorHandler(async (req) => {
  const c = await loadOrgPermissions(await getAuthContext())
  const b = await req.json()
  const i = bulkOperationBodySchema.parse(b)
  return NextResponse.json(await bulkRestore(c, i.resourceIds))
})
