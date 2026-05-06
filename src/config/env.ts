import { z } from 'zod';

const schema = z.object({
  VITE_BACKEND_BASE_URL: z.string().url(),
  VITE_IDLE_TIMEOUT_MIN: z.coerce.number().int().min(5).max(240).default(30),
  VITE_SENTRY_DSN: z.string().optional(),
});

const parsed = schema.safeParse(import.meta.env);
if (!parsed.success) {
   
  console.error('Invalid env config:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid env config — see console for details.');
}

export const env = {
  BACKEND_BASE_URL: parsed.data.VITE_BACKEND_BASE_URL,
  IDLE_TIMEOUT_MIN: parsed.data.VITE_IDLE_TIMEOUT_MIN,
  SENTRY_DSN: parsed.data.VITE_SENTRY_DSN,
} as const;
