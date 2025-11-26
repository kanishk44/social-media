import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('8080'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_TTL: z.string().default('15m'),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_BUCKET: z.string().default('media'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    // eslint-disable-next-line no-console
    console.error('❌ Invalid environment variables:', result.error.format());
    process.exit(1);
  }
  
  return result.data;
};

export const env = parseEnv();

