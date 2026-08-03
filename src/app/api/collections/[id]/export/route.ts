import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext } from '@/features/auth'
import { getCollection } from '@/features/collection'
import { exportResource } from '@/features/resource'

export const GET = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const { id } = (await ctx.params) as { id: string }
  const c = await getAuthContext()
  const collection = await getCollection(c, id)
  const exports = await Promise.all(collection.items.map((item) => exportResource(c, item.resourceId)))
  return NextResponse.json({ format: 'edubek.collection.v1', name: collection.name, resources: exports })
})
