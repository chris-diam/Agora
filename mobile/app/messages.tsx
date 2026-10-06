import { router, Stack, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Avatar } from "../components/Avatar";
import { useSocket } from "../context/SocketContext";
import { useTheme } from "../context/ThemeContext";
import { apiFetch } from "../lib/api";
import { fonts, type Palette } from "../lib/theme";

interface Partner {
  id: string;
  displayName: string;
  profileImageUrl: string | null;
}

interface LastMessage {
  content: string;
  senderId: string;
  createdAt: string;
}

interface ConversationSummary {
  partner: Partner;
  lastMessage: LastMessage | null;
  unreadCount: number;
}

export default function MessagesScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { socket, refreshUnreadCount } = useSocket();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await apiFetch<ConversationSummary[]>("/messages");
      setConversations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load messages");
    }
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await load();
      setIsLoading(false);
    })();
  }, [load]);

  // Refetches whenever this tab comes into view — catches a message that
  // arrived while the socket was reconnecting or the tab wasn't visible,
  // and resyncs the tab-bar badge (opening a conversation from here marks
  // it read server-side, so the badge count can change just by visiting).
  useFocusEffect(
    useCallback(() => {
      load();
      refreshUnreadCount();
    }, [load, refreshUnreadCount]),
  );

  // Live update while this tab stays mounted and focused elsewhere in the
  // app (e.g. the Feed tab is active) — a new message bumps the relevant
  // conversation to the top instead of waiting for a manual refresh.
  useEffect(() => {
    if (!socket) return;
    const handler = () => load();
    socket.on("message:new", handler);
    return () => {
      socket.off("message:new", handler);
    };
  }, [socket, load]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  };

  if (isLoading) return <Text style={styles.status}>Loading…</Text>;
  if (error) return <Text style={styles.status}>{error}</Text>;

  return (
    <FlatList
      data={conversations}
      keyExtractor={(item) => item.partner.id}
      style={styles.screen}
      contentContainerStyle={styles.list}
      ListHeaderComponent={<Stack.Screen options={{ title: "Messages", headerShown: true }} />}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.agora} />
      }
      ListEmptyComponent={
        <Text style={styles.status}>
          No conversations yet — you can message anyone you follow who follows you back.
        </Text>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push({ pathname: "/chat/[userId]", params: { userId: item.partner.id, name: item.partner.displayName } })}
        >
          <Avatar name={item.partner.displayName} imageUrl={item.partner.profileImageUrl} size={44} />
          <View style={styles.rowText}>
            <Text style={styles.name}>{item.partner.displayName}</Text>
            <Text style={styles.preview} numberOfLines={1}>
              {item.lastMessage?.content ?? "Say hello"}
            </Text>
          </View>
          {item.unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    />
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.agoraBg },
    list: { padding: 16, gap: 10 },
    status: { flex: 1, padding: 24, textAlign: "center", color: colors.agoraMuted, backgroundColor: colors.agoraBg },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderColor: colors.agoraBorder,
      backgroundColor: colors.agoraSurface,
      borderRadius: 16,
      padding: 12,
      marginBottom: 10,
    },
    rowText: { flex: 1, gap: 2 },
    name: { fontFamily: fonts.body, fontSize: 15, color: colors.agoraText },
    preview: { fontSize: 13, color: colors.agoraMuted },
    badge: {
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.agora,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 6,
    },
    badgeText: { color: colors.agoraOn, fontSize: 12, fontWeight: "700" },
  });
