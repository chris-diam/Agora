import { Link } from "react-router-dom";
import { RegisterForm } from "../components/RegisterForm";

export function RegisterPage() {
  return (
    <div className="mx-auto mt-12 max-w-sm rounded-2xl border border-agora-border bg-agora-surface/80 p-6 shadow-sm shadow-black/20 backdrop-blur-xl">
      <h1 className="mb-4 text-xl font-semibold text-agora-text">Create an account</h1>
      <RegisterForm />
      <p className="mt-4 text-sm text-agora-muted">
        Already have an account?{" "}
        <Link to="/login" className="text-agora hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
