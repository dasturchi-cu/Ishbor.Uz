import { z } from 'zod'

export const serviceCreateSchema = z.object({
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(20).max(5000),
  category: z.string().trim().min(1),
  region: z.string().trim().min(1),
  price: z.number().int().positive(),
  delivery_days: z.number().int().min(1).max(90).optional(),
})

export type ServiceCreateInput = z.infer<typeof serviceCreateSchema>
