import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { apiFetch, resolveMediaUrl } from "../../lib/api";
import { fonts, type Palette } from "../../lib/theme";

interface PortfolioLink {
  label: string;
  url: string;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio: string | null;
  profession: string | null;
  portfolioLinks: PortfolioLink[] | null;
  city: string | null;
  country: string | null;
  profileImageUrl: string | null;
  isMutualFriend?: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowedByViewer?: boolean;
}

interface ProfilePost {
  id: string;
  mediaUrl: string | null;
  mediaType: "IMAGE" | "VIDEO" | "LINK" | null;
}

export default function UserProfileScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user: viewer } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowBusy, setIsFollowBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const [profileData, postsData] = await Promise.all([
          apiFetch<UserProfile>(`/users/${userId}`),
          apiFetch<ProfilePost[]>(`/posts?authorId=${userId}&limit=30`),
        ]);
        setProfile(profileData);
        setIsFollowing(Boolean(profileData.isFollowedByViewer));
        setPosts(postsData.filter((post) => post.mediaType === "IMAGE" && post.mediaUrl));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load this profile");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [userId]);

  const toggleFollow = async () => {
    if (isFollowBusy) return;
    setIsFollowBusy(true);
    const next = !isFollowing;
    setIsFollowing(next);
    setProfile((p) => (p ? { ...p, followersCount: p.followersCount + (next ? 1 : -1) } : p));
    try {
      await apiFetch(`/users/${userId}/follow`, { method: next ? "POST" : "DELETE" });
    } catch {
      setIsFollowing(!next);
      setProfile((p) => (p ? { ...p, followersCount: p.followersCount + (next ? -1 : 1) } : p));
    } finally {
      setIsFollowBusy(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.agora} />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error ?? "Profile not found"}</Text>
      </View>
    );
  }

  const avatarUrl = resolveMediaUrl(profile.profileImageUrl);
  const isOwnProfile = viewer?.id === profile.id;
  const links = (profile.portfolioLinks ?? []).filter((link) => link.label && link.url);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: profile.displayName }} />
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarInitial}>{profile.displayName.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <Text style={styles.name}>{profile.displayName}</Text>
      <Text style={styles.username}>@{profile.username}</Text>
      {Boolean(profile.profession) && <Text style={styles.profession}>{profile.profession}</Text>}
      {Boolean(profile.city || profile.country) && (
        <Text style={styles.location}>{[profile.city, profile.country].filter(Boolean).join(", ")}</Text>
      )}
      {Boolean(profile.bio) && <Text style={styles.bio}>{profile.bio}</Text>}

      {links.length > 0 && (
        <View style={styles.linksRow}>
          {links.map((link) => (
            <TouchableOpacity
              key={link.url}
              style={styles.linkChip}
              onPress={() => Linking.openURL(link.url).catch(() => {})}
            >
              <Text style={styles.linkChipText}>{link.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Contact details only for mutual-follow friends — everyone else
          already gets Follow/Message as the way to reach out. */}
      {profile.isMutualFriend && (
        <TouchableOpacity
          style={styles.contactRow}
          onPress={() => Linking.openURL(`mailto:${profile.email}`).catch(() => {})}
        >
          <Text style={styles.contactLabel}>Email</Text>
          <Text style={styles.contactValue}>{profile.email}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{profile.postsCount}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{profile.followersCount}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{profile.followingCount}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
      </View>

      {!isOwnProfile && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.followButton, isFollowing && styles.followButtonActive]}
            onPress={toggleFollow}
          >
            <Text style={[styles.followButtonText, isFollowing && styles.followButtonTextActive]}>
              {isFollowing ? "Following" : "Follow"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.messageButton}
            onPress={() =>
              router.push({ pathname: "/chat/[userId]", params: { userId: profile.id, name: profile.displayName } })
            }
          >
            <Text style={styles.messageButtonText}>Message</Text>
          </TouchableOpacity>
        </View>
      )}

      {posts.length > 0 && (
        <View style={styles.mediaGrid}>
          {posts.map((post) => (
            <Image key={post.id} source={{ uri: resolveMediaUrl(post.mediaUrl)! }} style={styles.mediaTile} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.agoraBg },
    container: { alignItems: "center", padding: 24, gap: 6 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.agoraBg },
    error: { color: colors.agoraMuted },
    avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: 12 },
    avatarFallback: { backgroundColor: colors.agora, alignItems: "center", justifyContent: "center" },
    avatarInitial: { color: colors.agoraOn, fontSize: 32, fontWeight: "700" },
    name: { fontFamily: fonts.body, fontSize: 20, color: colors.agoraText },
    username: { fontSize: 14, color: colors.agoraMuted },
    profession: { fontSize: 13, color: colors.agora, fontWeight: "600", marginTop: 2 },
    location: { fontSize: 13, color: colors.agoraDim },
    bio: { fontSize: 14, color: colors.agoraMuted, textAlign: "center", marginTop: 8 },
    linksRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 10 },
    linkChip: {
      borderWidth: 1,
      borderColor: colors.agoraBorder,
      backgroundColor: colors.agoraSurface,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    linkChipText: { fontSize: 12, color: colors.agora, fontWeight: "600" },
    contactRow: {
      borderWidth: 1,
      borderColor: colors.agoraBorder,
      backgroundColor: colors.agoraSurface,
      borderRadius: 12,
      paddingVertical: 8,
      paddingHorizontal: 14,
      marginTop: 10,
      alignItems: "center",
    },
    contactLabel: { fontSize: 10, color: colors.agoraMuted, textTransform: "uppercase", fontWeight: "700" },
    contactValue: { fontSize: 13, color: colors.agora, marginTop: 2 },
    statsRow: { flexDirection: "row", gap: 28, marginTop: 20 },
    statItem: { alignItems: "center" },
    statNumber: { fontSize: 17, fontWeight: "700", color: colors.agoraText },
    statLabel: { fontSize: 12, color: colors.agoraMuted },
    actionsRow: { flexDirection: "row", gap: 10, marginTop: 24 },
    followButton: {
      backgroundColor: colors.agora,
      borderRadius: 999,
      paddingVertical: 10,
      paddingHorizontal: 22,
    },
    followButtonActive: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.agoraBorder },
    followButtonText: { color: colors.agoraOn, fontWeight: "600" },
    followButtonTextActive: { color: colors.agoraText },
    messageButton: {
      borderWidth: 1,
      borderColor: colors.agoraBorder,
      backgroundColor: colors.agoraSurface,
      borderRadius: 999,
      paddingVertical: 10,
      paddingHorizontal: 22,
    },
    messageButtonText: { color: colors.agoraText, fontWeight: "600" },
    mediaGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 3,
      marginTop: 28,
      width: "100%",
    },
    mediaTile: {
      width: "32.5%",
      aspectRatio: 1,
      borderRadius: 4,
      backgroundColor: colors.agoraSurface,
    },
  });
