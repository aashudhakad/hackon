import { z } from 'zod';

// Password validation regex: at least one uppercase, one lowercase, one number, one special character
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

export const signupSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .max(254, 'Email cannot exceed 254 characters')
    .email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot exceed 128 characters')
    .regex(
      passwordRegex,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    )
    .refine((val) => val.trim().length > 0, 'Password cannot be empty or whitespace-only'),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .max(254, 'Email cannot exceed 254 characters')
    .email('Invalid email format'),
  password: z
    .string()
    .min(1, 'Password is required')
    .refine((val) => val.trim().length > 0, 'Password cannot be empty or whitespace-only'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
