import { useState } from "react";
import { Link } from "react-router-dom";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useSearch } from "../hooks/useSearch";
import { Avatar } from "./Avatar";
import { SearchIcon } from "./icons";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const debouncedQuery = useDebouncedValue(query.trim(), 300);
  const { data, isFetching } = useSearch(debouncedQuery);

  const showResults = isFocused && debouncedQuery.length > 0;
  const users = data?.data.users ?? [];
  const communities = data?.data.communities ?? [];
  const hasResults = users.length > 0 || communities.length > 0;

  return (
    <div className="relative w-full max-w-md">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 150)}
        placeholder="Search people, communities..."
        className="w-full rounded-full border border-gray-200 bg-white/80 py-2 pr-3 pl-9 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-gray-900/10 focus:outline-none"
      />

      {showResults && (
        <div className="absolute top-full left-0 z-30 mt-2 w-full overflow-hidden rounded-2xl border border-white/60 bg-white/95 shadow-lg shadow-gray-900/10 backdrop-blur-xl">
          {isFetching && !hasResults && <p className="px-4 py-3 text-sm text-gray-400">Searching...</p>}
          {!isFetching && !hasResults && <p className="px-4 py-3 text-sm text-gray-400">No matches for "{debouncedQuery}"</p>}

          {users.length > 0 && (
            <div className="border-b border-gray-100 py-1">
              <p className="px-4 pt-1 pb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">People</p>
              {users.map((resultUser) => (
                <Link
                  key={resultUser.id}
                  to={`/profile/${resultUser.id}`}
                  className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-900/5"
                >
                  <Avatar name={resultUser.displayName} imageUrl={resultUser.profileImageUrl} size="sm" />
                  <span>
                    <span className="font-medium text-gray-900">{resultUser.displayName}</span>{" "}
                    <span className="text-gray-400">@{resultUser.username}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}

          {communities.length > 0 && (
            <div className="py-1">
              <p className="px-4 pt-1 pb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">Communities</p>
              {communities.map((community) => (
                <Link
                  key={community.id}
                  to={`/communities/${community.id}`}
                  className="flex items-center justify-between gap-2 px-4 py-2 text-sm hover:bg-gray-900/5"
                >
                  <span className="font-medium text-gray-900">{community.name}</span>
                  <span className="text-xs text-gray-400">{community.membersCount} members</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
