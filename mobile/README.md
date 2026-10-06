# KYMA mobile (foundation)

Expo/React Native app that talks to the same backend and Keycloak realm as
`frontend/` — same accounts, same data, same auth model (a direct Resource
Owner Password Credentials grant against Keycloak's token endpoint; see
`frontend/src/lib/authTokens.ts` for the pattern this mirrors in
`lib/authTokens.ts`, swapping `sessionStorage` for `expo-secure-store`).

**Scope:** this is a foundation, not a full feature port — login, a
chronological feed, an events list, and a profile/logout screen, wired to
the real API. It proves the mobile ↔ backend ↔ Keycloak connection end to
end; building out the rest of the web app's features (posts, comments,
communities, messaging, etc.) is follow-up work on top of this base.

New-message sounds (frontend request: "add sound when a message arrives
both on web and native") are wired on both sides from the same socket
event: the web app synthesizes a chime via the Web Audio API
(`frontend/src/lib/notificationSound.ts`); this app plays a bundled
`assets/notification.wav` (the same two-note chime, pre-rendered — Expo's
audio API plays sound assets rather than synthesizing tones at runtime)
via `expo-audio` (`lib/notificationSound.ts`).

## Setup

```bash
cd mobile
npm install
cp .env.example .env   # see its comments — "localhost" means different things
                        # on an emulator vs a physical device
npx expo start
```

Scan the QR code with Expo Go (iOS/Android), or press `i`/`a` for a
simulator, or `w` for a web preview (useful for a quick sanity check, but
not how this app is meant to be used day to day — browser CORS and
cross-origin isolation don't apply on a real device and can make the web
preview misbehave in ways native never would, e.g. needing the dev
Keycloak client's web origins list to include the preview's own origin).

The backend and local Keycloak are the same ones `frontend/` uses — follow
the root `README.md` sections 5–7 to have them running first.

## Structure

```
mobile/
├── app/            # Expo Router routes — one file per screen
│   ├── index.tsx       # redirects to /login or /(tabs)/feed
│   ├── login.tsx
│   └── (tabs)/
│       ├── feed.tsx
│       ├── events.tsx
│       └── profile.tsx
├── context/        # AuthContext, SocketContext — same shape as frontend/src/context
├── lib/            # authTokens, api client, notification sound
└── assets/
```

No registration screen — log in with an account already created on the
web app (same Keycloak realm, same backend).
