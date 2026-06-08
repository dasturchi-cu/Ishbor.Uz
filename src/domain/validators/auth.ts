import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})

export type LoginInput = z.infer<typeof loginSchema>

export const registerStep2Schema = z
  .object({
    fullName: z.string().trim().min(2),
    email: z.string().trim().email(),
    phone: z.string().trim().min(13),
    password: z.string().min(8),
    confirmPassword: z.string(),
    agreeTerms: z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
  })
  .refine((data) => data.agreeTerms, {
    path: ['agreeTerms'],
  })

export type RegisterStep2Input = z.infer<typeof registerStep2Schema>
