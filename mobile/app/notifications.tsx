import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Avatar } from "../components/Avatar";
import { useSocket } from "../context/SocketContext";
import { useTheme } from "../context/ThemeContext";
import { apiFetch } from "../lib/api";
import { formatRelativeTime } from "../lib/time";
import { fonts, type Palette } from "../lib/theme";

interface NotificationItem {
  id: string;
  type: "FOLLOW" | "LIKE" | "COMMENT";
  createdAt: string;
  actor: { id: string; displayName: string; profileImageUrl: string | null };
}

const TEXT_BY_TYPE: Record<NotificationItem["type"], string> = {
  FOLLOW: "started following you",
  LIKE: "liked your post",
  COMMENT: "commented on your post",
};

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { refreshUnreadNotificationsCount } = useSocket();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<NotificationItem[]>("/notifications");
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      // Mirrors the web app: opening the notifications list marks
      // everything read, so the bell badge clears once the viewer has
      // actually seen it.
      apiFetch("/notifications/read-all", { method: "POST" })
        .then(refreshUnreadNotificationsCount)
        .catch(() => {});
    }, [load, refreshUnreadNotificationsCount]),
  );

  if (isLoading) return <Text style={styles.status}>Loading…</Text>;

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.list}
      data={items}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={<Text style={styles.status}>No notifications yet.</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push({ pathname: "/user/[userId]", params: { userId: item.actor.id } })}
        >
          <Avatar name={item.actor.displayName} imageUrl={item.actor.profileImageUrl} size={40} />
          <View style={styles.rowText}>
            <Text style={styles.text}>
              <Text style={styles.actor}>{item.actor.displayName}</Text> {TEXT_BY_TYPE[item.type]}
            </Text>
            <Text style={styles.time}>{formatRelativeTime(item.createdAt)}</Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.agoraBg },
    list: { padding: 16, gap: 8 },
    status: { flex: 1, padding: 24, textAlign: "center", color: colors.agoraMuted, backgroundColor: colors.agoraBg },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderColor: colors.agoraBorder,
      backgroundColor: colors.agoraSurface,
      borderRadius: 14,
      padding: 12,
      marginBottom: 8,
    },
    rowText: { flex: 1, gap: 2 },
    text: { fontSize: 13, color: colors.agoraMuted },
    actor: { fontFamily: fonts.body, color: colors.agoraText, fontWeight: "600" },
    time: { fontSize: 11, color: colors.agoraDim },
  });
