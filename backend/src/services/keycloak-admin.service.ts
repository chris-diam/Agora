import { env } from "../config";
import { AppError } from "../utils/AppError";

const issuer = `${env.KEYCLOAK_URL}/realms/${env.KEYCLOAK_REALM}`;

// A service-account token, not the realm admin login — scoped to just the
// `manage-users` role on this realm's `realm-management` client, so a leak
// of this credential can create/modify users but can't touch realm
// settings, other clients, etc. See DEPLOYMENT.md for how this client is
// configured.
const getServiceAccountToken = async (): Promise<string> => {
  if (!env.KEYCLOAK_BACKEND_CLIENT_ID || !env.KEYCLOAK_BACKEND_CLIENT_SECRET) {
    throw new AppError("Registration is not configured on this server", 503);
  }

  const res = await fetch(`${issuer}/protocol/openid-connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: env.KEYCLOAK_BACKEND_CLIENT_ID,
      client_secret: env.KEYCLOAK_BACKEND_CLIENT_SECRET,
    }),
  });

  if (!res.ok) throw new AppError("Could not authenticate with the identity provider", 502);
  const body = (await res.json()) as { access_token: string };
  return body.access_token;
};

export interface CreateKeycloakUserInput {
  username: string;
  email: string;
  password: string;
  displayName: string;
}

// Creates the account directly via Keycloak's Admin API — this app's own
// registration form talks to our backend, not Keycloak's hosted pages, so
// there's no self-service registration flow to fall back on; the service
// account above stands in for it.
export const createKeycloakUser = async (input: CreateKeycloakUserInput): Promise<string> => {
  const token = await getServiceAccountToken();

  // This realm's user profile requires both firstName and lastName (not
  // just one) — a user missing either triggers Keycloak's "Account is not
  // fully set up" required-action check, which blocks the Direct Grant
  // login this app relies on entirely (it has no interactive flow to
  // complete that action through). Our own data model only has a single
  // displayName, so split it on the first space; a one-word name repeats
  // as both fields rather than leaving lastName empty (still required).
  const spaceIndex = input.displayName.indexOf(" ");
  const firstName = spaceIndex === -1 ? input.displayName : input.displayName.slice(0, spaceIndex);
  const lastName = spaceIndex === -1 ? input.displayName : input.displayName.slice(spaceIndex + 1);

  const res = await fetch(`${env.KEYCLOAK_URL}/admin/realms/${env.KEYCLOAK_REALM}/users`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      username: input.username,
      email: input.email,
      firstName,
      lastName,
      enabled: true,
      emailVerified: true,
      credentials: [{ type: "password", value: input.password, temporary: false }],
    }),
  });

  if (res.status === 409) {
    throw new AppError("That username or email is already registered", 409);
  }
  if (!res.ok) {
    throw new AppError("Could not create the account", 502);
  }

  // Keycloak returns the new user's location in a header, not a JSON body.
  const location = res.headers.get("Location");
  const keycloakId = location?.split("/").pop();
  if (!keycloakId) throw new AppError("Could not create the account", 502);
  return keycloakId;
};
