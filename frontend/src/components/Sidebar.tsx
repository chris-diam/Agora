import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEvents } from "../hooks/useEvents";
import { useUnreadMessageCount } from "../hooks/useMessages";
import {
  BookmarkIcon,
  CalendarIcon,
  ChatIcon,
  HomeIcon,
  MicIcon,
  MusicNoteIcon,
  NewsIcon,
  PaletteIcon,
  PinIcon,
  UserCircleIcon,
  UserHeartIcon,
  UsersIcon,
} from "./icons";

const NAV_ITEMS = [
  { to: "/news", label: "News", Icon: NewsIcon },
  { to: "/events", label: "Events", Icon: CalendarIcon, countKey: "events" as const },
  { to: "/music", label: "Music", Icon: MusicNoteIcon },
  { to: "/arts-culture", label: "Arts & culture", Icon: PaletteIcon },
  { to: "/communities", label: "Communities", Icon: UsersIcon },
  { to: "/artists", label: "Artists", Icon: MicIcon },
  { to: "/friends", label: "Friends", Icon: UserHeartIcon },
];

// The actual nav — shared by the persistent desktop Sidebar and the
// mobile slide-in drawer (MobileNavDrawer) so the links/hooks/counts exist
// in exactly one place. `onNavigate` lets the drawer close itself on click.
export function SidebarNavContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const location = useLocation();
  // Real counts, not decorative stats: upcoming events in the viewer's own
  // city (for the city widget) and overall (for the Events nav badge).
  const { data: upcomingInCity } = useEvents({ city: user?.city ?? undefined, limit: 1 });
  const { data: upcomingOverall } = useEvents({ limit: 1 });
  const { data: unreadMessages } = useUnreadMessageCount();
  const unreadMessageCount = unreadMessages?.data.count ?? 0;
  const upcomingEventsCount = upcomingOverall?.pagination?.totalItems ?? 0;

  // "/feed" and "/feed?type=local" share a pathname, so NavLink's built-in
  // isActive (which ignores search unless `to` itself includes one) can't
  // tell them apart — computed manually instead.
  const isLocalActive = location.pathname === "/feed" && new URLSearchParams(location.search).get("type") === "local";
  const isFeedActive = location.pathname === "/feed" && !isLocalActive;

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive ? "bg-agora text-agora-on" : "text-agora-muted hover:bg-white/5"
    }`;

  return (
    <>
      <nav className="flex flex-col gap-1 rounded-2xl border border-agora-border bg-agora-surface/80 p-3 shadow-sm shadow-black/20 backdrop-blur-xl">
        <NavLink to="/feed" className={linkClasses({ isActive: isFeedActive })} onClick={onNavigate}>
          <HomeIcon className="h-5 w-5 shrink-0" />
          Feed
        </NavLink>
        <Link to="/feed?type=local" className={linkClasses({ isActive: isLocalActive })} onClick={onNavigate}>
          <PinIcon className="h-5 w-5 shrink-0" />
          Local
        </Link>
        {NAV_ITEMS.map(({ to, label, Icon, countKey }) => (
          <NavLink key={to} to={to} className={linkClasses} onClick={onNavigate}>
            <Icon className="h-5 w-5 shrink-0" />
            {label}
            {countKey === "events" && upcomingEventsCount > 0 && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-agora-light px-1 text-xs font-medium text-agora-muted">
                {upcomingEventsCount > 99 ? "99+" : upcomingEventsCount}
              </span>
            )}
          </NavLink>
        ))}
        <NavLink to="/messages" className={linkClasses} onClick={onNavigate}>
          <ChatIcon className="h-5 w-5 shrink-0" />
          Messages
          {unreadMessageCount > 0 && (
            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-medium text-white">
              {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
            </span>
          )}
        </NavLink>
        {user && (
          <>
            <NavLink to="/saved" className={linkClasses} onClick={onNavigate}>
              <BookmarkIcon className="h-5 w-5 shrink-0" />
              Saved
            </NavLink>
            <NavLink to={`/profile/${user.id}`} className={linkClasses} onClick={onNavigate}>
              <UserCircleIcon className="h-5 w-5 shrink-0" />
              Profile
            </NavLink>
          </>
        )}
      </nav>

      {user?.city && (
        <div className="rounded-2xl border border-agora-border bg-agora-surface/80 p-4 shadow-sm shadow-black/20 backdrop-blur-xl">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-agora-dim">Your city pulse</p>
          <p className="text-lg font-semibold text-agora-text">{user.city}</p>
          <p className="text-sm text-agora-muted">
            {upcomingInCity?.pagination?.totalItems ?? 0} upcoming event
            {upcomingInCity?.pagination?.totalItems === 1 ? "" : "s"}
          </p>
        </div>
      )}
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-4 lg:flex">
      <SidebarNavContent />
    </aside>
  );
}
