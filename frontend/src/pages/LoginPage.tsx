import { Link } from "react-router-dom";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { LoginForm } from "../components/LoginForm";

export function LoginPage() {
  return (
    <div className="mx-auto mt-6 flex min-h-150 max-w-4xl overflow-hidden rounded-2xl border border-white/60 bg-white shadow-sm shadow-gray-900/10 lg:mt-12">
      <div className="hidden w-1/2 lg:block">
        <img src="/login-hero.jpg" alt="Agora — people, places, passions" className="h-full w-full object-cover" />
      </div>

      <div className="flex w-full flex-col justify-center px-8 py-10 sm:px-16 lg:w-1/2">
        <h1 className="mb-6 text-center text-2xl font-semibold text-agora-text">Log into Agora</h1>

        <LoginForm />

        <div className="my-5 flex items-center gap-3 text-xs text-gray-400">
          <div className="h-px flex-1 bg-gray-200" />
          OR
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <GoogleSignInButton />

        <div className="mt-6 border-t border-gray-100 pt-6 text-center">
          <p className="text-sm text-gray-600">
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
