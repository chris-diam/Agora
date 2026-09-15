// Minimal ambient types for the Google Identity Services script
// (https://accounts.google.com/gsi/client), loaded via a <script> tag in
// index.html rather than an npm package — Google doesn't publish official
// types for it, and pulling in a whole SDK for one button would be
// overkill for what we need here.
export {};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: { theme?: string; size?: string; width?: number; text?: string }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}
