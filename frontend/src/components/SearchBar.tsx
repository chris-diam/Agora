import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useSearch } from "../hooks/useSearch";
import { Avatar } from "./Avatar";
import { SearchIcon } from "./icons";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebouncedValue(query.trim(), 300);
  const { data, isFetching } = useSearch(debouncedQuery);

  const showResults = isFocused && debouncedQuery.length > 0;
  const users = data?.data.users ?? [];
  const communities = data?.data.communities ?? [];
  const hasResults = users.length > 0 || communities.length > 0;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative w-full max-w-md">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-agora-dim" />
      <input
        ref={inputRef}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 150)}
        placeholder="Search people, places, sounds..."
        className="w-full rounded-full border border-agora-border bg-agora-surface py-2 pr-14 pl-9 text-sm text-agora-text placeholder:text-agora-dim focus:ring-2 focus:ring-agora/30 focus:outline-none"
      />
      {!query && (
        <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded-md border border-agora-border px-1.5 py-0.5 text-[10px] font-medium text-agora-dim">
          ⌘K
        </kbd>
      )}

      {showResults && (
        <div className="absolute top-full left-0 z-30 mt-2 w-full overflow-hidden rounded-2xl border border-agora-border bg-agora-surface/95 shadow-lg shadow-black/30 backdrop-blur-xl">
          {isFetching && !hasResults && <p className="px-4 py-3 text-sm text-agora-dim">Searching...</p>}
          {!isFetching && !hasResults && <p className="px-4 py-3 text-sm text-agora-dim">No matches for "{debouncedQuery}"</p>}

          {users.length > 0 && (
            <div className="border-b border-agora-border py-1">
              <p className="px-4 pt-1 pb-1 text-xs font-semibold tracking-wide text-agora-dim uppercase">People</p>
              {users.map((resultUser) => (
                <Link
                  key={resultUser.id}
                  to={`/profile/${resultUser.id}`}
                  className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-white/5"
                >
                  <Avatar name={resultUser.displayName} imageUrl={resultUser.profileImageUrl} size="sm" />
                  <span>
                    <span className="font-medium text-agora-text">{resultUser.displayName}</span>{" "}
                    <span className="text-agora-dim">@{resultUser.username}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}

          {communities.length > 0 && (
            <div className="py-1">
              <p className="px-4 pt-1 pb-1 text-xs font-semibold tracking-wide text-agora-dim uppercase">Communities</p>
              {communities.map((community) => (
                <Link
                  key={community.id}
                  to={`/communities/${community.id}`}
                  className="flex items-center justify-between gap-2 px-4 py-2 text-sm hover:bg-white/5"
                >
                  <span className="font-medium text-agora-text">{community.name}</span>
                  <span className="text-xs text-agora-dim">{community.membersCount} members</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
