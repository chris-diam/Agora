import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  // The realm's base URL (e.g. http://localhost:8080 in dev, the Render
  // Keycloak service's URL in production) — REST/Socket.io auth verify
  // every access token against this realm's JWKS. See keycloak.service.ts.
  KEYCLOAK_URL: z.string().min(1, "KEYCLOAK_URL is required"),
  KEYCLOAK_REALM: z.string().min(1, "KEYCLOAK_REALM is required"),
  KEYCLOAK_CLIENT_ID: z.string().min(1, "KEYCLOAK_CLIENT_ID is required"),
  // Optional — a confidential service-account client (NOT the realm admin
  // account) scoped to just creating users, used by POST /api/auth/register
  // to call Keycloak's Admin API server-side. Unset = registration returns
  // a clear "not configured" error instead of crashing the whole server.
  KEYCLOAK_BACKEND_CLIENT_ID: z.string().optional(),
  KEYCLOAK_BACKEND_CLIENT_SECRET: z.string().optional(),
  // Unset in dev (reflects the request origin). Set to the deployed
  // frontend's exact origin in production, e.g. https://myapp.pages.dev
  CORS_ORIGIN: z.string().optional(),
  // Optional — powers the upcoming-events email digest (newsletter.service.ts).
  // Unset = the send endpoint returns a clear "not configured" error instead
  // of crashing. Sign up at resend.com for a key; RESEND_FROM_EMAIL must be
  // on a domain verified in that Resend account.
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  // Shared secret an external scheduler (e.g. a free cron-ping service or a
  // GitHub Actions scheduled workflow) presents to trigger the digest send
  // — there's no in-process cron here since Render's free tier sleeps the
  // service on inactivity, so a trigger has to come from outside.
  NEWSLETTER_CRON_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
