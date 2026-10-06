import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text } from "react-native";
import { FeedTuningHeader } from "../../components/FeedTuningHeader";
import { PostCard, type PostCardPost } from "../../components/PostCard";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { apiFetch } from "../../lib/api";
import type { FeedType } from "../../lib/feed";
import type { Palette } from "../../lib/theme";

interface FeedItem {
  post: PostCardPost;
  reason: string;
}

export default function FeedScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [feedType, setFeedType] = useState<FeedType>("following");
  const [showReasons, setShowReasons] = useState(false);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await apiFetch<FeedItem[]>(`/feed/${feedType}?page=1`);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the feed");
    }
  }, [feedType]);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await load();
      setIsLoading(false);
    })();
  }, [load]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  };

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.post.id}
      style={styles.screen}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.agora} />
      }
      ListHeaderComponent={
        <FeedTuningHeader
          feedType={feedType}
          onChangeFeedType={setFeedType}
          showReasons={showReasons}
          onToggleReasons={() => setShowReasons((v) => !v)}
          city={user?.city || "Athens"}
        />
      }
      ListEmptyComponent={
        !isLoading ? (
          <Text style={styles.status}>{error ?? "Nothing here yet."}</Text>
        ) : (
          <Text style={styles.status}>Loading…</Text>
        )
      }
      renderItem={({ item }) => <PostCard post={item.post} showReason={showReasons} reason={item.reason} />}
    />
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.agoraBg },
    list: { paddingBottom: 24 },
    status: { padding: 24, textAlign: "center", color: colors.agoraMuted },
  });
