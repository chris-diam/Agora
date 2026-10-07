import { Ionicons } from "@expo/vector-icons";
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

interface GroupChatMember {
  user: Partner;
}

interface GroupChatSummary {
  id: string;
  name: string;
  members: GroupChatMember[];
  lastMessage: (LastMessage & { sender: Partner }) | null;
  createdAt: string;
}

type Row =
  | { kind: "dm"; key: string; sortTime: number; data: ConversationSummary }
  | { kind: "group"; key: string; sortTime: number; data: GroupChatSummary };

export default function MessagesScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { socket, refreshUnreadCount } = useSocket();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [groupChats, setGroupChats] = useState<GroupChatSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [dms, groups] = await Promise.all([
        apiFetch<ConversationSummary[]>("/messages"),
        apiFetch<GroupChatSummary[]>("/group-chats"),
      ]);
      setConversations(dms);
      setGroupChats(groups);
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
    socket.on("group-message:new", handler);
    return () => {
      socket.off("message:new", handler);
      socket.off("group-message:new", handler);
    };
  }, [socket, load]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  };

  if (isLoading) return <Text style={styles.status}>Loading…</Text>;
  if (error) return <Text style={styles.status}>{error}</Text>;

  const rows: Row[] = [
    ...conversations.map(
      (c): Row => ({
        kind: "dm",
        key: `dm-${c.partner.id}`,
        sortTime: c.lastMessage ? new Date(c.lastMessage.createdAt).getTime() : 0,
        data: c,
      }),
    ),
    ...groupChats.map(
      (g): Row => ({
        kind: "group",
        key: `group-${g.id}`,
        sortTime: g.lastMessage ? new Date(g.lastMessage.createdAt).getTime() : new Date(g.createdAt).getTime(),
        data: g,
      }),
    ),
  ].sort((a, b) => b.sortTime - a.sortTime);

  return (
    <FlatList
      data={rows}
      keyExtractor={(item) => item.key}
      style={styles.screen}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View>
          <Stack.Screen options={{ title: "Messages", headerShown: true }} />
          <TouchableOpacity style={styles.newGroupButton} onPress={() => router.push("/create-group-chat")}>
            <Ionicons name="people" size={15} color={colors.agora} />
            <Text style={styles.newGroupButtonText}>New group chat</Text>
          </TouchableOpacity>
        </View>
      }
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.agora} />
      }
      ListEmptyComponent={
        <Text style={styles.status}>
          No conversations yet — you can message anyone you follow who follows you back.
        </Text>
      }
      renderItem={({ item }) =>
        item.kind === "dm" ? (
          <TouchableOpacity
            style={styles.row}
            onPress={() =>
              router.push({
                pathname: "/chat/[userId]",
                params: { userId: item.data.partner.id, name: item.data.partner.displayName },
              })
            }
          >
            <Avatar name={item.data.partner.displayName} imageUrl={item.data.partner.profileImageUrl} size={44} />
            <View style={styles.rowText}>
              <Text style={styles.name}>{item.data.partner.displayName}</Text>
              <Text style={styles.preview} numberOfLines={1}>
                {item.data.lastMessage?.content ?? "Say hello"}
              </Text>
            </View>
            {item.data.unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.data.unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.row}
            onPress={() =>
              router.push({ pathname: "/group-chat/[chatId]", params: { chatId: item.data.id, name: item.data.name } })
            }
          >
            <View style={styles.groupIcon}>
              <Ionicons name="people" size={20} color={colors.agora} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.name}>{item.data.name}</Text>
              <Text style={styles.preview} numberOfLines={1}>
                {item.data.lastMessage ? `${item.data.lastMessage.sender.displayName}: ${item.data.lastMessage.content}` : `${item.data.members.length} members`}
              </Text>
            </View>
          </TouchableOpacity>
        )
      }
    />
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.agoraBg },
    list: { padding: 16, gap: 10 },
    status: { flex: 1, padding: 24, textAlign: "center", color: colors.agoraMuted, backgroundColor: colors.agoraBg },
    newGroupButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderWidth: 1,
      borderColor: colors.agoraBorder,
      backgroundColor: colors.agoraSurface,
      borderRadius: 999,
      paddingVertical: 10,
      marginBottom: 14,
    },
    newGroupButtonText: { color: colors.agora, fontSize: 13, fontWeight: "600" },
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
    groupIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.agoraBg,
      alignItems: "center",
      justifyContent: "center",
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
