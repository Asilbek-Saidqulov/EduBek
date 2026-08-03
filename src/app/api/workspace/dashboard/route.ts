import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext, loadOrgPermissions } from '@/features/auth'
import { getDashboard } from '@/features/workspace'
export const GET = withErrorHandler(async () => { const c = await loadOrgPermissions(await getAuthContext()); return NextResponse.json(await getDashboard(c)) })
