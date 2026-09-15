import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Avatar } from "./Avatar";
import { PlusIcon } from "./icons";
import { NotificationsBell } from "./NotificationsBell";
import { SearchBar } from "./SearchBar";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/50 bg-white/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link to="/" className="flex shrink-0 items-center gap-2 text-lg font-semibold text-gray-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-sm text-white">
            S
          </span>
          <span className="hidden sm:inline">Social Platform</span>
        </Link>

        <SearchBar />

        <nav className="ml-auto flex shrink-0 items-center gap-3 text-sm text-gray-600">
          {isAuthenticated && user ? (
            <>
              <NotificationsBell />
              <Link
                to="/posts/new"
                className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                <PlusIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Create</span>
              </Link>
              <Link to={`/profile/${user.id}`} title={user.displayName}>
                <Avatar name={user.displayName} imageUrl={user.profileImageUrl} size="md" />
              </Link>
              <button type="button" onClick={handleLogout} className="hover:text-gray-900">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-gray-900">
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
