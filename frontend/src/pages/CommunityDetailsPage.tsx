import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Avatar } from "../components/Avatar";
import { CreatePost } from "../components/CreatePost";
import { EventList } from "../components/EventList";
import { Feed } from "../components/Feed";
import { useAuth } from "../context/AuthContext";
import { useCommunity, useCommunityMembers, useJoinCommunity, useLeaveCommunity } from "../hooks/useCommunities";
import { useEvents } from "../hooks/useEvents";
import { usePosts } from "../hooks/usePosts";

type Tab = "about" | "events" | "discussions" | "people";

const TABS: { key: Tab; label: string }[] = [
  { key: "about", label: "About" },
  { key: "events", label: "Events" },
  { key: "discussions", label: "Discussions" },
  { key: "people", label: "People" },
];

export function CommunityDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const { data, isLoading, isError } = useCommunity(id ?? "");
  const joinMutation = useJoinCommunity();
  const leaveMutation = useLeaveCommunity();
  const [tab, setTab] = useState<Tab>("about");

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

      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              tab === item.key ? "bg-agora text-agora-on" : "bg-agora-light text-agora-muted hover:bg-agora-border"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "about" && (
        <div className="rounded-2xl border border-agora-border bg-agora-surface/80 p-5 text-sm text-agora-muted shadow-sm shadow-black/20 backdrop-blur-xl">
          {community.description ?? "This community hasn't added a description yet."}
        </div>
      )}

      {tab === "events" && <CommunityEventsTab communityId={community.id} isMember={Boolean(community.isMember)} />}

      {tab === "discussions" && (
        <CommunityDiscussionsTab communityId={community.id} isMember={Boolean(community.isMember)} />
      )}

      {tab === "people" && <CommunityPeopleTab communityId={community.id} />}
    </div>
  );
}

function CommunityEventsTab({ communityId, isMember }: { communityId: string; isMember: boolean }) {
  const { data, isLoading, isError } = useEvents({ communityId, limit: 20 });

  return (
    <div className="flex flex-col gap-3">
      {isMember && (
        <Link
          to={`/events/new?communityId=${communityId}`}
          className="self-start rounded-full bg-agora px-4 py-1.5 text-sm font-medium text-agora-on hover:bg-agora-hover"
        >
          Organize an event
        </Link>
      )}
      <EventList events={data?.data ?? []} isLoading={isLoading} isError={isError} />
    </div>
  );
}

function CommunityDiscussionsTab({ communityId, isMember }: { communityId: string; isMember: boolean }) {
  const { data, isLoading, isError, error } = usePosts({ communityId, limit: 20 });

  return (
    <div className="flex flex-col gap-3">
      {isMember && <CreatePost communityId={communityId} placeholder="Start a discussion..." />}
      <Feed
        items={(data?.data ?? []).map((post) => ({ post }))}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error instanceof Error ? error.message : undefined}
        showReasons={false}
      />
    </div>
  );
}

function CommunityPeopleTab({ communityId }: { communityId: string }) {
  const { data, isLoading, isError } = useCommunityMembers(communityId, { limit: 50 });
  const members = data?.data ?? [];

  if (isLoading) return <p className="text-agora-muted">Loading members...</p>;
  if (isError) return <p className="text-red-500">Could not load members.</p>;
  if (members.length === 0) return <p className="text-agora-muted">No members yet.</p>;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {members.map((member) => (
        <Link
          key={member.id}
          to={`/profile/${member.id}`}
          className="flex items-center gap-3 rounded-2xl border border-agora-border bg-agora-surface/80 p-3 shadow-sm shadow-black/20 backdrop-blur-xl hover:bg-agora-surface"
        >
          <Avatar name={member.displayName} imageUrl={member.profileImageUrl} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-agora-text">{member.displayName}</p>
            <p className="truncate text-xs text-agora-dim">@{member.username}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
