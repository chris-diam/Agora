import Keycloak from "keycloak-js";

// Module-level singleton — must exist exactly once per page load. React 18
// Strict Mode double-invokes effects in dev, and keycloak-js throws if
// `init()` runs twice on the same instance, so callers guard that
// separately (see AuthContext's initKeycloakOnce) rather than recreating
// this.
export const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
});

// Keycloak's access tokens are short-lived (minutes, not the old system's
// 7 days) — this fires on expiry regardless of whether anything happens to
// be making a request at that moment, so long-open tabs (and the Socket.io
// connection, which only re-sends auth on reconnect) stay usable without
// the user noticing. A failed refresh means the session is genuinely gone
// (refresh token expired/revoked) — send them back through login rather
// than leaving the app silently broken.
keycloak.onTokenExpired = () => {
  keycloak.updateToken(30).catch(() => keycloak.login());
};
