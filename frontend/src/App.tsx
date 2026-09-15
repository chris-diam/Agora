import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navigate, Outlet, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { ChatDock } from "./components/ChatDock";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Sidebar } from "./components/Sidebar";
import { ToastStack } from "./components/ToastStack";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { CommunitiesPage } from "./pages/CommunitiesPage";
import { CommunityDetailsPage } from "./pages/CommunityDetailsPage";
import { ConversationPage } from "./pages/ConversationPage";
import { CreateCommunityPage } from "./pages/CreateCommunityPage";
import { CreateEventPage } from "./pages/CreateEventPage";
import { CreatePostPage } from "./pages/CreatePostPage";
import { EventDetailsPage } from "./pages/EventDetailsPage";
import { EventsPage } from "./pages/EventsPage";
import { FeedPage } from "./pages/FeedPage";
import { FriendsPage } from "./pages/FriendsPage";
import { LoginPage } from "./pages/LoginPage";
import { MessagesPage } from "./pages/MessagesPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RegisterPage } from "./pages/RegisterPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

// The slow-moving background blobs live once, behind everything, so they're
// not re-mounted (and re-animated from scratch) on every route change.
function BackgroundBlobs() {
  return (
    // No overflow-hidden here — the blobs are position:fixed with negative
    // offsets so they bleed past the viewport edge on purpose; clipping this
    // wrapper would cut that off. Fixed children don't add scroll area, so
    // there's no scrollbar side effect from letting them extend past 100%.
    <div className="pointer-events-none fixed inset-0" aria-hidden="true">
      <div className="bg-blob blob-a" />
      <div className="bg-blob blob-b" />
      <div className="bg-blob blob-c" />
    </div>
  );
}

// App pages (feed, events, communities, profile) get the sidebar shell.
function ShellLayout() {
  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}

// Marketing/auth pages stay a plain centered column, no sidebar.
function PlainLayout() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <Outlet />
    </main>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <div className="relative min-h-screen">
              <BackgroundBlobs />
              <Navbar />
              <ToastStack />
              <ChatDock />
              <Routes>
                <Route element={<PlainLayout />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                </Route>

                <Route element={<ShellLayout />}>
                  {/* The feed IS the homepage — no separate landing page or
                      "go to your feed" button. FeedPage already handles both
                      authenticated and anonymous viewers. */}
                  <Route path="/" element={<FeedPage />} />
                  <Route path="/feed" element={<FeedPage />} />
                  <Route path="/events" element={<EventsPage />} />
                  <Route path="/events/:id" element={<EventDetailsPage />} />
                  <Route path="/communities" element={<CommunitiesPage />} />
                  <Route path="/communities/:id" element={<CommunityDetailsPage />} />
                  <Route path="/profile/:id" element={<ProfilePage />} />

                  <Route element={<ProtectedRoute />}>
                    <Route path="/events/new" element={<CreateEventPage />} />
                    <Route path="/communities/new" element={<CreateCommunityPage />} />
                    <Route path="/posts/new" element={<CreatePostPage />} />
                    <Route path="/friends" element={<FriendsPage />} />
                    <Route path="/messages" element={<MessagesPage />} />
                    <Route path="/messages/:userId" element={<ConversationPage />} />
                  </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
