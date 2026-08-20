import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext } from '@/features/auth'
import { updateCategory, deleteCategory, updateCategoryBodySchema, categoryIdParamsSchema } from '@/features/category'
export const PATCH = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const { id } = categoryIdParamsSchema.parse(await ctx.params)
  const authCtx = await getAuthContext()
  const body = await req.json()
  const input = updateCategoryBodySchema.parse(body)
  const category = await updateCategory(authCtx, id, input)
  return NextResponse.json(category)
})
export const DELETE = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const { id } = categoryIdParamsSchema.parse(await ctx.params)
  const authCtx = await getAuthContext()
  await deleteCategory(authCtx, id)
  return NextResponse.json({ success: true })
})
