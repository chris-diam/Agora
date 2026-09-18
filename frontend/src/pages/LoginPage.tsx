import { Link } from "react-router-dom";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { LoginForm } from "../components/LoginForm";

export function LoginPage() {
  return (
    <div className="mx-auto mt-6 flex min-h-150 max-w-4xl overflow-hidden rounded-2xl border border-agora-border bg-agora-surface shadow-sm shadow-black/30 lg:mt-12">
      <div className="hidden w-1/2 lg:block">
        <img src="/login-hero.jpg" alt="KYMA — people, places, passions" className="h-full w-full object-cover" />
      </div>

      <div className="flex w-full flex-col justify-center px-8 py-10 sm:px-16 lg:w-1/2">
        <h1 className="mb-6 text-center text-2xl font-semibold text-agora-text">Log into KYMA</h1>

        <LoginForm />

        <div className="my-5 flex items-center gap-3 text-xs text-agora-dim">
          <div className="h-px flex-1 bg-agora-border" />
          OR
          <div className="h-px flex-1 bg-agora-border" />
        </div>

        <GoogleSignInButton />

        <div className="mt-6 border-t border-agora-border pt-6 text-center">
          <p className="text-sm text-agora-muted">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-agora hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
