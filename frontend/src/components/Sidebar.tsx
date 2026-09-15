import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEvents } from "../hooks/useEvents";
import { useUnreadMessageCount } from "../hooks/useMessages";
import { CalendarIcon, ChatIcon, HomeIcon, UserCircleIcon, UserHeartIcon, UsersIcon } from "./icons";

const NAV_ITEMS = [
  { to: "/feed", label: "Feed", Icon: HomeIcon },
  { to: "/events", label: "Events", Icon: CalendarIcon },
  { to: "/communities", label: "Communities", Icon: UsersIcon },
  { to: "/friends", label: "Friends", Icon: UserHeartIcon },
];

export function Sidebar() {
  const { user } = useAuth();
  // Real count, not a decorative stat: upcoming events in the viewer's own
  // city, reusing the same filter the Events page and local feed use.
  const { data: upcomingInCity } = useEvents({ city: user?.city ?? undefined, limit: 1 });
  const { data: unreadMessages } = useUnreadMessageCount();
  const unreadMessageCount = unreadMessages?.data.count ?? 0;

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-900/5"
    }`;

  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-4 lg:flex">
      <nav className="flex flex-col gap-1 rounded-2xl border border-white/60 bg-white/70 p-3 shadow-sm shadow-gray-900/5 backdrop-blur-xl">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} className={linkClasses}>
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </NavLink>
        ))}
        <NavLink to="/messages" className={linkClasses}>
          <ChatIcon className="h-5 w-5 shrink-0" />
          Messages
          {unreadMessageCount > 0 && (
            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-medium text-white">
              {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
            </span>
          )}
        </NavLink>
        {user && (
          <NavLink to={`/profile/${user.id}`} className={linkClasses}>
            <UserCircleIcon className="h-5 w-5 shrink-0" />
            Profile
          </NavLink>
        )}
      </nav>

      {user?.city && (
        <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm shadow-gray-900/5 backdrop-blur-xl">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Your city</p>
          <p className="text-lg font-semibold text-gray-900">{user.city}</p>
          <p className="text-sm text-gray-500">
            {upcomingInCity?.pagination?.totalItems ?? 0} upcoming event
            {upcomingInCity?.pagination?.totalItems === 1 ? "" : "s"}
          </p>
        </div>
      )}
    </aside>
  );
}
