import { z } from 'zod'

export const profileUpdateSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  username: z.string().trim().min(3).max(30).optional().or(z.literal('')),
  bio: z.string().trim().max(500).optional(),
  region: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(9).max(20).optional(),
  specialty: z.string().trim().max(200).optional(),
})

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
