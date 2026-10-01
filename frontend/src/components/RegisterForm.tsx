import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function RegisterForm() {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await register({ displayName, username, email, password });
      navigate("/feed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label htmlFor="register-display-name" className="mb-1 block text-sm font-medium text-agora-muted">
          Display name
        </label>
        <input
          id="register-display-name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          required
          className="w-full rounded-xl border border-agora-border bg-agora-surface p-2 text-sm focus:ring-2 focus:ring-agora/30 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="register-username" className="mb-1 block text-sm font-medium text-agora-muted">
          Username
        </label>
        <input
          id="register-username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
          minLength={3}
          pattern="[a-zA-Z0-9_]+"
          title="Letters, numbers, and underscores only"
          className="w-full rounded-xl border border-agora-border bg-agora-surface p-2 text-sm focus:ring-2 focus:ring-agora/30 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="register-email" className="mb-1 block text-sm font-medium text-agora-muted">
          Email
        </label>
        <input
          id="register-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className="w-full rounded-xl border border-agora-border bg-agora-surface p-2 text-sm focus:ring-2 focus:ring-agora/30 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="register-password" className="mb-1 block text-sm font-medium text-agora-muted">
          Password
        </label>
        <input
          id="register-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
          className="w-full rounded-xl border border-agora-border bg-agora-surface p-2 text-sm focus:ring-2 focus:ring-agora/30 focus:outline-none"
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-agora px-4 py-2 text-sm font-medium text-agora-on hover:bg-agora-hover disabled:opacity-50"
      >
        {isSubmitting ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
