import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext } from '@/features/auth'
import { getCategories, createCategory, createCategoryBodySchema } from '@/features/marketplace'
export const GET = withErrorHandler(async () => NextResponse.json({ categories: await getCategories() }))
export const POST = withErrorHandler(async (req) => { const ctx = await getAuthContext(); const b = await req.json(); const i = createCategoryBodySchema.parse(b); return NextResponse.json(await createCategory(ctx, i), { status: 201 }) })
