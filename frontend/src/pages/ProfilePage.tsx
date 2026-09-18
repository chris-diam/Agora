import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { resolveMediaUrl } from "../api/client";
import { Avatar } from "../components/Avatar";
import { EventCard } from "../components/EventCard";
import { Feed } from "../components/Feed";
import { CameraIcon, CloseIcon, LinkIcon } from "../components/icons";
import { useAuth } from "../context/AuthContext";
import { useChatDock } from "../context/SocketContext";
import { useCommunities } from "../hooks/useCommunities";
import { useEvents } from "../hooks/useEvents";
import { useInterests, useSetMyInterests } from "../hooks/useInterests";
import { usePosts } from "../hooks/usePosts";
import { useFollowUser, useUnfollowUser, useUpdateProfile, useUploadAvatar, useUser } from "../hooks/useUsers";
import type { EventItem, PortfolioLink, Post } from "../types";

export function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const { openChat } = useChatDock();
  const { data: profileResult, isLoading, isError } = useUser(id ?? "");
  const { data: postsResult, isLoading: postsLoading, isError: postsError } = usePosts({ authorId: id });
  const [isEditing, setIsEditing] = useState(false);

  if (isLoading) return <p className="text-agora-muted">Loading profile...</p>;
  if (isError || !profileResult) return <p className="text-red-500">User not found.</p>;

  const profile = profileResult.data;
  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="rounded-3xl border border-agora-border bg-agora-surface/80 p-6 shadow-sm shadow-black/20 backdrop-blur-xl">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <Avatar name={profile.displayName} imageUrl={profile.profileImageUrl} size="lg" />
            <div>
              <h1 className="text-xl font-semibold text-agora-text">{profile.displayName}</h1>
              <p className="text-sm text-agora-muted">@{profile.username}</p>
            </div>
          </div>
          {isOwnProfile ? (
            <button
              type="button"
              onClick={() => setIsEditing((value) => !value)}
              className="shrink-0 rounded-full border border-agora-border bg-agora-surface/80 px-3 py-1 text-sm hover:bg-agora-surface"
            >
              {isEditing ? "Cancel" : "Edit profile"}
            </button>
          ) : (
            <div className="flex shrink-0 items-center gap-2">
              {profile.isMutualFriend && (
                <button
                  type="button"
                  onClick={() => openChat(profile.id)}
                  className="rounded-full border border-agora-border bg-agora-surface/80 px-3 py-1 text-sm font-medium text-agora-muted hover:bg-agora-surface"
                >
                  Message
                </button>
              )}
              <FollowButton userId={profile.id} initiallyFollowing={Boolean(profile.isFollowedByViewer)} />
            </div>
          )}
        </div>
        {profile.profession && (
          <p className="mb-1 text-sm font-medium text-agora">{profile.profession}</p>
        )}
        {profile.bio && <p className="mb-2 text-agora-muted">{profile.bio}</p>}
        {(profile.city || profile.country) && (
          <p className="mb-2 text-sm text-agora-muted">{[profile.city, profile.country].filter(Boolean).join(", ")}</p>
        )}
        {profile.portfolioLinks && profile.portfolioLinks.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-3">
            {profile.portfolioLinks.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-agora hover:underline"
              >
                <LinkIcon className="h-3.5 w-3.5" />
                {link.label}
              </a>
            ))}
          </div>
        )}
        <div className="flex gap-4 text-sm text-agora-muted">
          <span>{profile.postsCount} posts</span>
          <span>{profile.followersCount} followers</span>
          <span>{profile.followingCount} following</span>
        </div>
      </div>

      {isOwnProfile && isEditing && <ProfileEditPanel onDone={() => setIsEditing(false)} />}

      {profile.profession && <ArtistSections userId={profile.id} />}

      <MediaGrid posts={postsResult?.data ?? []} />

      <h2 className="text-lg font-medium text-agora-text">Posts</h2>
      <Feed
        items={(postsResult?.data ?? []).map((post) => ({ post }))}
        isLoading={postsLoading}
        isError={postsError}
      />
    </div>
  );
}

// Shown on any profile that's opted into the "artist page" fields
// (profession set) — turns the plain profile into a mini cultural page:
// what they're doing next, what communities they're part of, and where
// they've played before. All derived from data that already exists
// (organized events, community membership) — no separate profile entity.
function ArtistSections({ userId }: { userId: string }) {
  const { data: eventsResult } = useEvents({ organizerId: userId, limit: 50 });
  const { data: communitiesResult } = useCommunities({ memberId: userId, limit: 6 });

  const events = eventsResult?.data ?? [];
  const now = Date.now();
  const upcomingEvents = events
    .filter((event) => new Date(event.startDate).getTime() >= now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  const pastEvents = events
    .filter((event) => new Date(event.startDate).getTime() < now)
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  const placesPlayed = Array.from(
    new Map(pastEvents.map((event) => [`${event.venueName ?? ""}|${event.city}`, event])).values()
  ).slice(0, 6);

  const communities = communitiesResult?.data ?? [];

  if (upcomingEvents.length === 0 && communities.length === 0 && placesPlayed.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {upcomingEvents.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-medium text-agora-text">Upcoming events</h2>
          <div className="flex flex-col gap-3">
            {upcomingEvents.slice(0, 5).map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {communities.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-medium text-agora-text">Communities</h2>
          <div className="flex flex-wrap gap-2">
            {communities.map((community) => (
              <Link
                key={community.id}
                to={`/communities/${community.id}`}
                className="rounded-full border border-agora-border bg-agora-surface/80 px-3 py-1.5 text-sm text-agora-muted shadow-sm shadow-black/20 backdrop-blur-xl hover:bg-agora-surface"
              >
                {community.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {placesPlayed.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-medium text-agora-text">Places played</h2>
          <div className="flex flex-wrap gap-2">
            {placesPlayed.map((event) => (
              <PlaceChip key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function PlaceChip({ event }: { event: EventItem }) {
  return (
    <Link
      to={`/events/${event.id}`}
      className="rounded-full border border-agora-border bg-agora-surface/80 px-3 py-1.5 text-sm text-agora-muted shadow-sm shadow-black/20 backdrop-blur-xl hover:bg-agora-surface"
    >
      {event.venueName ?? event.city}
    </Link>
  );
}

function MediaGrid({ posts }: { posts: Post[] }) {
  const mediaPosts = posts.filter((post) => post.mediaType === "IMAGE" || post.mediaType === "VIDEO");
  if (mediaPosts.length === 0) return null;

  return (
    <div>
      <h2 className="mb-2 text-lg font-medium text-agora-text">Media</h2>
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {mediaPosts.map((post) => (
          <a
            key={post.id}
            href={`#post-${post.id}`}
            className="group relative aspect-square overflow-hidden rounded-lg bg-agora-surface"
          >
            {post.mediaType === "VIDEO" ? (
              <video src={resolveMediaUrl(post.mediaUrl) ?? undefined} className="h-full w-full object-cover" muted />
            ) : (
              <img
                src={resolveMediaUrl(post.mediaUrl) ?? undefined}
                alt=""
                className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
              />
            )}
          </a>
        ))}
      </div>
    </div>
  );
}

function FollowButton({ userId, initiallyFollowing }: { userId: string; initiallyFollowing: boolean }) {
  const [isFollowing, setIsFollowing] = useState(initiallyFollowing);
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  const handleClick = async () => {
    if (isFollowing) {
      await unfollowMutation.mutateAsync(userId);
      setIsFollowing(false);
    } else {
      await followMutation.mutateAsync(userId);
      setIsFollowing(true);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={followMutation.isPending || unfollowMutation.isPending}
      className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium ${
        isFollowing
          ? "border border-agora-border bg-agora-surface/80 text-agora-muted hover:bg-agora-surface"
          : "bg-agora text-agora-on hover:bg-agora-hover"
      }`}
    >
      {isFollowing ? "Unfollow" : "Follow"}
    </button>
  );
}

function ProfileEditPanel({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const { data: interestsResult } = useInterests();
  const updateProfile = useUpdateProfile();
  const setMyInterests = useSetMyInterests();
  const uploadAvatar = useUploadAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [profession, setProfession] = useState(user?.profession ?? "");
  const [portfolioLinks, setPortfolioLinks] = useState<PortfolioLink[]>(user?.portfolioLinks ?? []);
  const [city, setCity] = useState(user?.city ?? "");
  const [country, setCountry] = useState(user?.country ?? "");
  const [selectedInterestIds, setSelectedInterestIds] = useState<string[]>(
    user?.interests.map((interest) => interest.id) ?? []
  );

  const updatePortfolioLink = (index: number, field: keyof PortfolioLink, value: string) => {
    setPortfolioLinks((previous) => previous.map((link, i) => (i === index ? { ...link, [field]: value } : link)));
  };

  const removePortfolioLink = (index: number) => {
    setPortfolioLinks((previous) => previous.filter((_, i) => i !== index));
  };

  const toggleInterest = (interestId: string) => {
    setSelectedInterestIds((previous) =>
      previous.includes(interestId) ? previous.filter((id) => id !== interestId) : [...previous, interestId]
    );
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) uploadAvatar.mutate(file);
    event.target.value = ""; // allow re-selecting the same file later
  };

  const handleSave = async () => {
    const cleanedLinks = portfolioLinks.filter((link) => link.label.trim() && link.url.trim());
    await updateProfile.mutateAsync({ displayName, bio, profession, portfolioLinks: cleanedLinks, city, country });
    await setMyInterests.mutateAsync(selectedInterestIds);
    onDone();
  };

  const inputClasses =
    "w-full rounded-xl border border-agora-border bg-agora-surface p-2 text-sm focus:ring-2 focus:ring-agora/30 focus:outline-none";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-agora-border bg-agora-surface/80 p-4 shadow-sm shadow-black/20 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group relative"
          aria-label="Change avatar"
        >
          <Avatar name={user?.displayName ?? "?"} imageUrl={user?.profileImageUrl} size="lg" />
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 text-white opacity-0 transition-opacity group-hover:bg-black/40 group-hover:opacity-100">
            <CameraIcon className="h-6 w-6" />
          </span>
        </button>
        <div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadAvatar.isPending}
            className="rounded-full border border-agora-border bg-agora-surface/80 px-3 py-1 text-sm hover:bg-agora-surface disabled:opacity-50"
          >
            {uploadAvatar.isPending ? "Uploading..." : "Change photo"}
          </button>
          {uploadAvatar.isError && <p className="mt-1 text-xs text-red-500">{uploadAvatar.error.message}</p>}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
      </div>
      <div>
        <label htmlFor="edit-display-name" className="mb-1 block text-sm font-medium text-agora-muted">
          Display name
        </label>
        <input
          id="edit-display-name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className={inputClasses}
        />
      </div>
      <div>
        <label htmlFor="edit-bio" className="mb-1 block text-sm font-medium text-agora-muted">
          Bio
        </label>
        <textarea id="edit-bio" value={bio} onChange={(event) => setBio(event.target.value)} rows={2} className={inputClasses} />
      </div>
      <div>
        <label htmlFor="edit-profession" className="mb-1 block text-sm font-medium text-agora-muted">
          Profession (optional — e.g. "Saxophonist", "Fashion Designer")
        </label>
        <input
          id="edit-profession"
          value={profession}
          onChange={(event) => setProfession(event.target.value)}
          className={inputClasses}
        />
      </div>
      <div>
        <p className="mb-1 text-sm font-medium text-agora-muted">Portfolio links</p>
        <div className="flex flex-col gap-2">
          {portfolioLinks.map((link, index) => (
            <div key={index} className="flex gap-2">
              <input
                value={link.label}
                onChange={(event) => updatePortfolioLink(index, "label", event.target.value)}
                placeholder="Label (e.g. Spotify)"
                className={inputClasses}
              />
              <input
                value={link.url}
                onChange={(event) => updatePortfolioLink(index, "url", event.target.value)}
                placeholder="https://..."
                className={inputClasses}
              />
              <button
                type="button"
                onClick={() => removePortfolioLink(index)}
                className="shrink-0 rounded-full border border-agora-border px-2 text-agora-muted hover:bg-agora-surface"
                aria-label="Remove link"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setPortfolioLinks((previous) => [...previous, { label: "", url: "" }])}
            className="self-start rounded-full border border-agora-border px-3 py-1 text-xs text-agora-muted hover:bg-agora-surface"
          >
            + Add link
          </button>
        </div>
      </div>
      <div className="flex gap-2">
        <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="City" className={inputClasses} />
        <input
          value={country}
          onChange={(event) => setCountry(event.target.value)}
          placeholder="Country"
          className={inputClasses}
        />
      </div>
      <div>
        <p className="mb-1 text-sm font-medium text-agora-muted">Interests</p>
        <div className="flex flex-wrap gap-2">
          {(interestsResult?.data ?? []).map((interest) => (
            <button
              key={interest.id}
              type="button"
              onClick={() => toggleInterest(interest.id)}
              className={`rounded-full px-3 py-1 text-xs ${
                selectedInterestIds.includes(interest.id) ? "bg-agora text-agora-on" : "bg-agora-light text-agora-muted"
              }`}
            >
              {interest.name}
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={handleSave}
        disabled={updateProfile.isPending || setMyInterests.isPending}
        className="self-start rounded-full bg-agora px-4 py-1.5 text-sm font-medium text-agora-on hover:bg-agora-hover disabled:opacity-50"
      >
        Save changes
      </button>
    </div>
  );
}
