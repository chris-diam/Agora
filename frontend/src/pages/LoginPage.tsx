import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { keycloak } from "../lib/keycloak";

// A stable internal link target ("Login" in the navbar, redirects to
// /login, etc.) that just hands off to Keycloak's own hosted login page —
// which also renders the "Sign in with Google" button (Google is a realm
// identity provider now, not something this app talks to directly) and a
// "Register" link for new accounts.
//
// Two things this must get right or the flow infinite-loops: (1) an
// explicit redirectUri back to "/", not the default (the current URL,
// i.e. "/login" itself) — landing back on this page would just trigger
// another login() call; (2) only calling login() once auth state has
// resolved and genuinely isn't authenticated, since an existing Keycloak
// session would otherwise re-authenticate silently and redirect again on
// every mount.
export function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      keycloak.login({ redirectUri: `${window.location.origin}/` });
    }
  }, [isLoading, isAuthenticated]);

  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <div className="mx-auto mt-12 max-w-sm text-center">
      <p className="text-agora-muted">Taking you to sign in...</p>
    </div>
  );
}
