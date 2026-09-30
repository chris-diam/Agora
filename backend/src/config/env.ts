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
  // Unset in dev (reflects the request origin). Set to the deployed
  // frontend's exact origin in production, e.g. https://myapp.pages.dev
  CORS_ORIGIN: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
