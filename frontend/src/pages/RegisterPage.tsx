import { Link } from "react-router-dom";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { RegisterForm } from "../components/RegisterForm";

export function RegisterPage() {
  return (
    <div className="mx-auto mt-12 max-w-sm rounded-2xl border border-white/60 bg-white/70 p-6 shadow-sm shadow-gray-900/5 backdrop-blur-xl">
      <h1 className="mb-4 text-xl font-semibold text-gray-900">Create an account</h1>
      <GoogleSignInButton />
      <div className="my-4 flex items-center gap-3 text-xs text-gray-400">
        <div className="h-px flex-1 bg-gray-200" />
        or continue with email
        <div className="h-px flex-1 bg-gray-200" />
      </div>
      <RegisterForm />
      <p className="mt-4 text-sm text-gray-500">
        Already have an account?{" "}
        <Link to="/login" className="text-agora hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
