import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { AppHeader } from "../../components/AppHeader";
import { PostCard, type PostCardPost } from "../../components/PostCard";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { apiFetch } from "../../lib/api";
import { fonts, type Palette } from "../../lib/theme";

interface FeedItem {
  post: PostCardPost;
  reason: string;
}

export default function LocalScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<FeedItem[]>("/feed/local?page=1");
      setItems(data);
    } catch {
      setItems([]);
    }
  }, []);

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
      style={styles.screen}
      contentContainerStyle={styles.list}
      data={items}
      keyExtractor={(item) => item.post.id}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.agora} />}
      ListHeaderComponent={
        <View>
          <AppHeader />
          <View style={styles.titleBlock}>
            <Text style={styles.title}>What's happening in {user?.city || "your city"}</Text>
            <Text style={styles.subtitle}>Stories from people and places near you.</Text>
          </View>
        </View>
      }
      ListEmptyComponent={
        !isLoading ? <Text style={styles.status}>Nothing local yet — add a city on your profile.</Text> : null
      }
      renderItem={({ item }) => <PostCard post={item.post} />}
    />
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.agoraBg },
    list: { paddingBottom: 24 },
    titleBlock: { paddingHorizontal: 16, marginBottom: 16, gap: 4 },
    title: { fontFamily: fonts.body, fontSize: 22, color: colors.agoraText },
    subtitle: { fontSize: 13, color: colors.agoraMuted },
    status: { padding: 24, textAlign: "center", color: colors.agoraMuted },
  });
