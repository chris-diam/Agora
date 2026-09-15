import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Vite only exposes env vars prefixed VITE_ to client code.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export function GoogleSignInButton() {
  const buttonRef = useRef<HTMLDivElement>(null);
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    let cancelled = false;
    let pollId: ReturnType<typeof setInterval> | undefined;

    const init = () => {
      if (cancelled || !window.google || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          loginWithGoogle(response.credential)
            .then(() => navigate("/feed"))
            .catch((err: unknown) => {
              console.error("Google sign-in failed", err);
            });
        },
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
      });
    };

    // The GIS script tag loads async — it may not have attached to `window`
    // yet when this effect runs, so poll briefly rather than assume it has.
    if (window.google) {
      init();
    } else {
      pollId = setInterval(() => {
        if (window.google) {
          clearInterval(pollId);
          init();
        }
      }, 100);
    }

    return () => {
      cancelled = true;
      if (pollId) clearInterval(pollId);
    };
  }, [loginWithGoogle, navigate]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <p className="rounded-xl border border-dashed border-gray-300 bg-white/50 p-3 text-center text-xs text-gray-400">
        Google sign-in isn't configured yet.
      </p>
    );
  }

  return <div ref={buttonRef} className="flex justify-center" />;
}
