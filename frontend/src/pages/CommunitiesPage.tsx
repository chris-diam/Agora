import { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "../components/Avatar";
import { Pagination } from "../components/Pagination";
import { useAuth } from "../context/AuthContext";
import { useCommunities, useJoinCommunity, useLeaveCommunity } from "../hooks/useCommunities";
import type { Community } from "../types";

export function CommunitiesPage() {
  const { isAuthenticated } = useAuth();
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useCommunities({
    page,
    city: city || undefined,
    country: country || undefined,
    category: category || undefined,
  });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-agora-text">Communities</h1>
        {isAuthenticated && (
          <Link
            to="/communities/new"
            className="rounded-full bg-agora px-4 py-1.5 text-sm font-medium text-agora-on hover:bg-agora-hover"
          >
            Create community
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-agora-border bg-agora-surface/80 p-3 shadow-sm shadow-black/20 backdrop-blur-xl">
        <input
          value={city}
          onChange={(event) => {
            setCity(event.target.value);
            setPage(1);
          }}
          placeholder="City"
          className="rounded-xl border border-agora-border bg-agora-surface px-3 py-1.5 text-sm focus:ring-2 focus:ring-agora/30 focus:outline-none"
        />
        <input
          value={country}
          onChange={(event) => {
            setCountry(event.target.value);
            setPage(1);
          }}
          placeholder="Country"
          className="rounded-xl border border-agora-border bg-agora-surface px-3 py-1.5 text-sm focus:ring-2 focus:ring-agora/30 focus:outline-none"
        />
        <input
          value={category}
          onChange={(event) => {
            setCategory(event.target.value);
            setPage(1);
          }}
          placeholder="Category"
          className="rounded-xl border border-agora-border bg-agora-surface px-3 py-1.5 text-sm focus:ring-2 focus:ring-agora/30 focus:outline-none"
        />
      </div>

      {isLoading && <p className="text-agora-muted">Loading communities...</p>}
      {isError && <p className="text-red-500">Could not load communities.</p>}
      {!isLoading && !isError && (data?.data.length ?? 0) === 0 && (
        <p className="text-agora-muted">No communities found.</p>
      )}

      <div className="flex flex-col gap-3">
        {(data?.data ?? []).map((community) => (
          <CommunityCard key={community.id} community={community} />
        ))}
      </div>

      {data?.pagination && <Pagination pagination={data.pagination} onPageChange={setPage} />}
    </div>
  );
}

function CommunityCard({ community }: { community: Community }) {
  const { isAuthenticated } = useAuth();
  const joinMutation = useJoinCommunity();
  const leaveMutation = useLeaveCommunity();

  return (
    <div className="rounded-2xl border border-agora-border bg-agora-surface/80 p-4 shadow-sm shadow-black/20 backdrop-blur-xl">
      <div className="mb-1 flex items-center justify-between gap-2">
        <Link to={`/communities/${community.id}`} className="flex items-center gap-3">
          <Avatar name={community.name} size="sm" />
          <h2 className="font-medium text-agora-text hover:underline">{community.name}</h2>
        </Link>
        {isAuthenticated &&
          (community.isMember ? (
            <button
              type="button"
              onClick={() => leaveMutation.mutate(community.id)}
              className="shrink-0 rounded-full border border-agora-border bg-agora-surface/80 px-3 py-1 text-sm hover:bg-agora-surface"
            >
              Leave
            </button>
          ) : (
            <button
              type="button"
              onClick={() => joinMutation.mutate(community.id)}
              className="shrink-0 rounded-full bg-agora px-3 py-1 text-sm text-agora-on hover:bg-agora-hover"
            >
              Join
            </button>
          ))}
      </div>
      {community.description && <p className="mb-2 text-sm text-agora-muted">{community.description}</p>}
      <p className="text-xs text-agora-muted">
        {[community.category, community.city, community.country].filter(Boolean).join(" · ")} ·{" "}
        {community.membersCount} members
      </p>
    </div>
  );
}
