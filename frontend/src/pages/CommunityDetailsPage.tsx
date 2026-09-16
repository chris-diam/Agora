import { useParams } from "react-router-dom";
import { Avatar } from "../components/Avatar";
import { useAuth } from "../context/AuthContext";
import { useCommunity, useJoinCommunity, useLeaveCommunity } from "../hooks/useCommunities";

export function CommunityDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const { data, isLoading, isError } = useCommunity(id ?? "");
  const joinMutation = useJoinCommunity();
  const leaveMutation = useLeaveCommunity();

  if (isLoading) return <p className="text-agora-muted">Loading community...</p>;
  if (isError || !data) return <p className="text-red-500">Community not found.</p>;

  const community = data.data;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="rounded-2xl border border-agora-border bg-agora-surface/80 p-6 shadow-sm shadow-black/20 backdrop-blur-xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar name={community.name} size="lg" />
            <div>
              <h1 className="text-xl font-semibold text-agora-text">{community.name}</h1>
              <p className="text-sm text-agora-muted">
                {[community.category, community.city, community.country].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
          {isAuthenticated &&
            (community.isMember ? (
              <button
                type="button"
                onClick={() => leaveMutation.mutate(community.id)}
                className="shrink-0 rounded-full border border-agora-border bg-agora-surface/80 px-4 py-1.5 text-sm font-medium text-agora-muted hover:bg-agora-surface"
              >
                Leave
              </button>
            ) : (
              <button
                type="button"
                onClick={() => joinMutation.mutate(community.id)}
                className="shrink-0 rounded-full bg-agora px-4 py-1.5 text-sm font-medium text-agora-on hover:bg-agora-hover"
              >
                Join
              </button>
            ))}
        </div>
        {community.description && <p className="mb-3 text-agora-muted">{community.description}</p>}
        <p className="text-sm text-agora-muted">
          {community.membersCount} member{community.membersCount === 1 ? "" : "s"} · created by{" "}
          {community.creator.displayName}
        </p>
      </div>
    </div>
  );
}
