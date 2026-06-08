import { z } from 'zod'

export const postProjectSchema = z.object({
  title: z.string().trim().min(10).max(200),
  description: z.string().trim().min(30).max(8000),
  category: z.string().trim().min(1),
  region: z.string().trim().min(1),
  budget: z.number().int().positive(),
})

export type PostProjectInput = z.infer<typeof postProjectSchema>
