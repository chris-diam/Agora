import { useEffect } from "react";
import { keycloak } from "../lib/keycloak";

// A stable internal link target ("Login" in the navbar, redirects to
// /login, etc.) that just hands off to Keycloak's own hosted login page —
// which also renders the "Sign in with Google" button (Google is a realm
// identity provider now, not something this app talks to directly) and a
// "Register" link for new accounts. Calls the singleton directly (not
// useAuth().login, which is a fresh closure every render) so this
// mount-once redirect can use an empty dependency array safely.
export function LoginPage() {
  useEffect(() => {
    keycloak.login();
  }, []);

  return (
    <div className="mx-auto mt-12 max-w-sm text-center">
      <p className="text-agora-muted">Taking you to sign in...</p>
    </div>
  );
}
