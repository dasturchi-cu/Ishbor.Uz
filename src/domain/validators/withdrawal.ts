import { z } from 'zod'

export const withdrawalSchema = z.object({
  amount: z.number().int().positive(),
  note: z.string().trim().max(500).optional(),
})

export type WithdrawalInput = z.infer<typeof withdrawalSchema>
