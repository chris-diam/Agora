import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useParams } from "react-router-dom";
import { Avatar } from "../components/Avatar";
import { Feed } from "../components/Feed";
import { CameraIcon } from "../components/icons";
import { useAuth } from "../context/AuthContext";
import { useChatDock } from "../context/SocketContext";
import { useInterests, useSetMyInterests } from "../hooks/useInterests";
import { usePosts } from "../hooks/usePosts";
import { useFollowUser, useUnfollowUser, useUpdateProfile, useUploadAvatar, useUser } from "../hooks/useUsers";

export function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const { openChat } = useChatDock();
  const { data: profileResult, isLoading, isError } = useUser(id ?? "");
  const { data: postsResult, isLoading: postsLoading, isError: postsError } = usePosts({ authorId: id });
  const [isEditing, setIsEditing] = useState(false);

  if (isLoading) return <p className="text-gray-500">Loading profile...</p>;
  if (isError || !profileResult) return <p className="text-red-500">User not found.</p>;

  const profile = profileResult.data;
  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-sm shadow-gray-900/5 backdrop-blur-xl">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <Avatar name={profile.displayName} imageUrl={profile.profileImageUrl} size="lg" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{profile.displayName}</h1>
              <p className="text-sm text-gray-500">@{profile.username}</p>
            </div>
          </div>
          {isOwnProfile ? (
            <button
              type="button"
              onClick={() => setIsEditing((value) => !value)}
              className="shrink-0 rounded-full border border-gray-300 bg-white/70 px-3 py-1 text-sm hover:bg-white"
            >
              {isEditing ? "Cancel" : "Edit profile"}
            </button>
          ) : (
            <div className="flex shrink-0 items-center gap-2">
              {profile.isMutualFriend && (
                <button
                  type="button"
                  onClick={() => openChat(profile.id)}
                  className="rounded-full border border-gray-300 bg-white/70 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-white"
                >
                  Message
                </button>
              )}
              <FollowButton userId={profile.id} initiallyFollowing={Boolean(profile.isFollowedByViewer)} />
            </div>
          )}
        </div>
        {profile.bio && <p className="mb-2 text-gray-700">{profile.bio}</p>}
        {(profile.city || profile.country) && (
          <p className="mb-2 text-sm text-gray-500">{[profile.city, profile.country].filter(Boolean).join(", ")}</p>
        )}
        <div className="flex gap-4 text-sm text-gray-500">
          <span>{profile.postsCount} posts</span>
          <span>{profile.followersCount} followers</span>
          <span>{profile.followingCount} following</span>
        </div>
      </div>

      {isOwnProfile && isEditing && <ProfileEditPanel onDone={() => setIsEditing(false)} />}

      <h2 className="text-lg font-medium text-gray-900">Posts</h2>
      <Feed
        items={(postsResult?.data ?? []).map((post) => ({ post }))}
        isLoading={postsLoading}
        isError={postsError}
      />
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
          ? "border border-gray-300 bg-white/70 text-gray-700 hover:bg-white"
          : "bg-agora text-white hover:bg-agora-hover"
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
  const [city, setCity] = useState(user?.city ?? "");
  const [country, setCountry] = useState(user?.country ?? "");
  const [selectedInterestIds, setSelectedInterestIds] = useState<string[]>(
    user?.interests.map((interest) => interest.id) ?? []
  );

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
    await updateProfile.mutateAsync({ displayName, bio, city, country });
    await setMyInterests.mutateAsync(selectedInterestIds);
    onDone();
  };

  const inputClasses =
    "w-full rounded-xl border border-gray-200 bg-white/80 p-2 text-sm focus:ring-2 focus:ring-gray-900/10 focus:outline-none";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm shadow-gray-900/5 backdrop-blur-xl">
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
            className="rounded-full border border-gray-300 bg-white/70 px-3 py-1 text-sm hover:bg-white disabled:opacity-50"
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
        <label htmlFor="edit-display-name" className="mb-1 block text-sm font-medium text-gray-700">
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
        <label htmlFor="edit-bio" className="mb-1 block text-sm font-medium text-gray-700">
          Bio
        </label>
        <textarea id="edit-bio" value={bio} onChange={(event) => setBio(event.target.value)} rows={2} className={inputClasses} />
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
        <p className="mb-1 text-sm font-medium text-gray-700">Interests</p>
        <div className="flex flex-wrap gap-2">
          {(interestsResult?.data ?? []).map((interest) => (
            <button
              key={interest.id}
              type="button"
              onClick={() => toggleInterest(interest.id)}
              className={`rounded-full px-3 py-1 text-xs ${
                selectedInterestIds.includes(interest.id) ? "bg-agora text-white" : "bg-gray-100 text-gray-700"
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
        className="self-start rounded-full bg-agora px-4 py-1.5 text-sm font-medium text-white hover:bg-agora-hover disabled:opacity-50"
      >
        Save changes
      </button>
    </div>
  );
}
