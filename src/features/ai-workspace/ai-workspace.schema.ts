import { z } from 'zod'
export const createSessionBodySchema = z.object({ title: z.string().max(200).optional(), orgId: z.string().optional(), currentResourceId: z.string().optional() })
export const generateBodySchema = z.object({ generationType: z.string().min(1), variables: z.record(z.string(), z.string()).default({}), orgId: z.string().optional(), sessionId: z.string().optional(), sessionTitle: z.string().max(200).optional() })
export const editBodySchema = z.object({ resourceId: z.string().min(1), editType: z.enum(['rewrite', 'improve', 'simplify', 'expand', 'shorten']), instructions: z.string().max(1000).optional(), sessionId: z.string().optional() })
export const convertBodySchema = z.object({ resourceId: z.string().min(1), targetType: z.string().min(1), sessionId: z.string().optional() })
