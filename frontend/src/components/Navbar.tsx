import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Avatar } from "./Avatar";
import { LogoMarkIcon, MenuIcon, PlusIcon } from "./icons";
import { NotificationsBell } from "./NotificationsBell";
import { SearchBar } from "./SearchBar";
import { ThemeSwitcher } from "./ThemeSwitcher";

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-agora-border bg-agora-surface/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-agora-muted hover:bg-white/5 lg:hidden"
          aria-label="Open menu"
        >
          <MenuIcon className="h-5 w-5" />
        </button>

        <Link to="/" className="flex shrink-0 items-center gap-2">
          <LogoMarkIcon className="h-8 w-8 text-agora" />
          <span className="hidden sm:block">
            <span className="block text-lg leading-none font-bold tracking-tight text-agora-text">KYMA</span>
            <span className="block text-[9px] leading-none tracking-[0.25em] text-agora-dim">PEOPLE PLACES PASSIONS</span>
          </span>
        </Link>

        <div className="order-3 w-full min-w-0 sm:order-0 sm:w-auto sm:flex-1">
          <SearchBar />
        </div>

        <nav className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-3 text-sm text-agora-muted">
          <ThemeSwitcher />
          {isAuthenticated && user ? (
            <>
              <NotificationsBell />
              <Link
                to="/posts/new"
                className="flex items-center gap-1.5 rounded-full bg-agora px-4 py-2 text-sm font-medium text-agora-on hover:bg-agora-hover"
              >
                <PlusIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Create</span>
              </Link>
              <Link to={`/profile/${user.id}`} title={user.displayName}>
                <Avatar name={user.displayName} imageUrl={user.profileImageUrl} size="md" />
              </Link>
              <button type="button" onClick={logout} className="hover:text-agora-text">
                Logout
              </button>
            </>
          ) : isLoading ? (
            // Auth status hasn't resolved yet (restoring a session from a
            // refresh, most likely) — render a same-sized placeholder
            // instead of "Log in", which would otherwise flash briefly for
            // an already-logged-in user before flipping to the real
            // authenticated view a moment later.
            <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-agora-light" aria-hidden="true" />
          ) : (
            <button
              type="button"
              onClick={login}
              className="rounded-full bg-agora px-4 py-2 text-agora-on hover:bg-agora-hover"
            >
              Log in
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
