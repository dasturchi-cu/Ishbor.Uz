import { z } from 'zod'

export const serviceCreateSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(5000),
  category: z.string().trim().min(1),
  region: z.string().trim().min(1),
  price: z.number().int().positive(),
  delivery_days: z.number().int().min(1).max(365).optional(),
})

export type ServiceCreateInput = z.infer<typeof serviceCreateSchema>
