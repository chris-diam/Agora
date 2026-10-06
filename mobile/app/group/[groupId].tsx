import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { PostCard, type PostCardPost } from "../../components/PostCard";
import { useTheme } from "../../context/ThemeContext";
import { apiFetch } from "../../lib/api";
import { fonts, type Palette } from "../../lib/theme";

interface CommunityDetail {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  country: string | null;
  membersCount: number;
  isMember?: boolean;
}

export default function GroupDetailScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const [community, setCommunity] = useState<CommunityDetail | null>(null);
  const [posts, setPosts] = useState<PostCardPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  const load = useCallback(async () => {
    try {
      const [communityData, postsData] = await Promise.all([
        apiFetch<CommunityDetail>(`/communities/${groupId}`),
        apiFetch<PostCardPost[]>(`/posts?communityId=${groupId}&limit=20`),
      ]);
      setCommunity(communityData);
      setPosts(postsData);
    } catch {
      setCommunity(null);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleJoin = async () => {
    if (!community || isJoining) return;
    setIsJoining(true);
    const next = !community.isMember;
    setCommunity({ ...community, isMember: next, membersCount: community.membersCount + (next ? 1 : -1) });
    try {
      await apiFetch(`/communities/${groupId}/join`, { method: next ? "POST" : "DELETE" });
    } catch {
      setCommunity((c) => c && { ...c, isMember: !next, membersCount: c.membersCount + (next ? -1 : 1) });
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.agora} />
      </View>
    );
  }

  if (!community) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Community not found.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.list}
      data={posts}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View>
          <Stack.Screen options={{ title: community.name, headerShown: true }} />
          <View style={styles.header}>
            <Text style={styles.name}>{community.name}</Text>
            {Boolean(community.description) && <Text style={styles.description}>{community.description}</Text>}
            <Text style={styles.meta}>
              {community.membersCount} members
              {community.city ? ` · ${community.city}` : ""}
            </Text>
            <TouchableOpacity
              style={[styles.joinButton, community.isMember && styles.joinButtonActive]}
              onPress={toggleJoin}
            >
              <Text style={[styles.joinButtonText, community.isMember && styles.joinButtonTextActive]}>
                {community.isMember ? "Joined" : "Join"}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionLabel}>Discussions</Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.muted}>No posts in this community yet.</Text>}
      renderItem={({ item }) => <PostCard post={item} />}
    />
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.agoraBg },
    list: { paddingBottom: 24 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.agoraBg },
    muted: { color: colors.agoraMuted, textAlign: "center", padding: 24 },
    header: { padding: 20, gap: 6, borderBottomWidth: 1, borderBottomColor: colors.agoraBorder, marginBottom: 12 },
    name: { fontFamily: fonts.body, fontSize: 22, color: colors.agoraText },
    description: { fontSize: 14, color: colors.agoraMuted },
    meta: { fontSize: 12, color: colors.agoraDim, marginBottom: 6 },
    joinButton: {
      alignSelf: "flex-start",
      backgroundColor: colors.agora,
      borderRadius: 999,
      paddingVertical: 9,
      paddingHorizontal: 20,
    },
    joinButtonActive: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.agoraBorder },
    joinButtonText: { color: colors.agoraOn, fontWeight: "600" },
    joinButtonTextActive: { color: colors.agoraText },
    sectionLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.agoraMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      paddingHorizontal: 16,
      marginBottom: 8,
    },
  });
