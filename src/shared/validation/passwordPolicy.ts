import { z } from 'zod'

export const PASSWORD_POLICY_MESSAGE = 'Password must be at least 8 characters and include at least one uppercase and one lowercase letter.'

const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/

export const buildPasswordPolicySchema = (requiredMessage: string) =>
  z
    .string()
    .min(1, requiredMessage)
    .regex(PASSWORD_POLICY_REGEX, PASSWORD_POLICY_MESSAGE)

