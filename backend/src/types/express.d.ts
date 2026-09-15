// Prepped for the auth phase: augments Express's Request with the
// authenticated user attached by auth.middleware.ts.
export interface AuthUser {
  id: string;
  username: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
