import { z } from 'zod'

type passwordSchemaType = z.infer<typeof passwordSchema>

interface PasswordConfirmationInput {
  newPassword: passwordSchemaType
  confirmPassword: passwordSchemaType
}

function passwordConfirmationRefinement({ confirmPassword, newPassword }: PasswordConfirmationInput, ctx: z.RefinementCtx) {
  if (confirmPassword !== newPassword) {
    ctx.addIssue({
      path: ['confirmPassword'],
      code: z.ZodIssueCode.custom,
      message: '新密码和确认密码不匹配。',
    })
  }
}

const customSignInErrorMap: z.ZodErrorMap = (issue, ctx) => {
  if (issue.code === z.ZodIssueCode.invalid_union_discriminator) {
    return { message: '指定的登录提供商无效。' }
  }
  return { message: ctx.defaultError }
}

export const emailSchema = z
  .string({ message: '电子邮箱是必填项。' })
  .email({ message: '无效的电子邮件地址。' })
  .toLowerCase()
  .trim()

export const passwordSchema = z
  .string({ message: '密码是必填项。' })
  .min(8, '密码长度至少为 8 个字符。')
  .max(32, '密码长度必须小于 32 个字符。')

export const tokenSchema = z.string().min(1, '令牌是必填项。')

export const signInSchema = z.discriminatedUnion(
  'provider',
  [
    z.object({
      email: z.string(),
      password: passwordSchema,
      provider: z.literal('sign-in'),
    }),
  ],
  { errorMap: customSignInErrorMap },
)

export const signUpSchema = z.object({
  // email: emailSchema,
  password: passwordSchema,
  name: z
    .string({ message: '昵称是必填项。' })
    .min(3, '昵称长度至少为 3 个字符。')
    .trim(),
})

export const forgetPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z
  .object({
    token: tokenSchema,
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .superRefine(passwordConfirmationRefinement)

export const changePasswordSchema = z
  .object({
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .superRefine(passwordConfirmationRefinement)
