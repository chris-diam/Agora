import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppHeader } from "../../components/AppHeader";
import { Avatar } from "../../components/Avatar";
import { useTheme } from "../../context/ThemeContext";
import { apiFetch, resolveMediaUrl } from "../../lib/api";
import { fonts, type Palette } from "../../lib/theme";

interface Organizer {
  id: string;
  displayName: string;
  profileImageUrl: string | null;
}

interface EventItem {
  id: string;
  title: string;
  description: string;
  city: string;
  country: string;
  startDate: string;
  imageUrl: string | null;
  attendeesCount: number;
  organizer: Organizer;
}

export default function EventsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await apiFetch<EventItem[]>("/events?page=1&limit=20");
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load events");
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

  if (isLoading) return <Text style={styles.status}>Loading…</Text>;
  if (error) return <Text style={styles.status}>{error}</Text>;

  return (
    <FlatList
      data={events}
      keyExtractor={(item) => item.id}
      style={styles.screen}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.agora} />
      }
      ListHeaderComponent={
        <View>
          <AppHeader />
          <View style={styles.titleRow}>
            <Text style={styles.screenTitle}>Events</Text>
            <TouchableOpacity style={styles.createButton} onPress={() => router.push("/create-event")}>
              <Text style={styles.createButtonText}>+ New event</Text>
            </TouchableOpacity>
          </View>
        </View>
      }
      ListEmptyComponent={<Text style={styles.status}>No upcoming events.</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => router.push({ pathname: "/event/[eventId]", params: { eventId: item.id } })}
        >
          {item.imageUrl && <Image source={{ uri: resolveMediaUrl(item.imageUrl)! }} style={styles.media} />}
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>
            {new Date(item.startDate).toLocaleString()} · {item.city}, {item.country}
          </Text>
          <Text style={styles.description}>{item.description}</Text>
          <TouchableOpacity
            style={styles.organizerRow}
            onPress={() => router.push({ pathname: "/user/[userId]", params: { userId: item.organizer.id } })}
          >
            <Avatar name={item.organizer.displayName} imageUrl={item.organizer.profileImageUrl} size={22} />
            <Text style={styles.organizerText}>Organized by {item.organizer.displayName}</Text>
          </TouchableOpacity>
          <Text style={[styles.meta, styles.lastMeta]}>{item.attendeesCount} attending</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.agoraBg },
    list: { paddingBottom: 24 },
    status: { flex: 1, padding: 24, textAlign: "center", color: colors.agoraMuted, backgroundColor: colors.agoraBg },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    screenTitle: { fontFamily: fonts.body, fontSize: 22, color: colors.agoraText },
    createButton: {
      borderWidth: 1,
      borderColor: colors.agoraBorder,
      backgroundColor: colors.agoraSurface,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    createButtonText: { fontSize: 12, color: colors.agora, fontWeight: "600" },
    card: {
      borderWidth: 1,
      borderColor: colors.agoraBorder,
      backgroundColor: colors.agoraSurface,
      borderRadius: 16,
      overflow: "hidden",
      marginHorizontal: 16,
      marginBottom: 12,
    },
    media: { width: "100%", height: 160 },
    title: { fontFamily: fonts.body, fontWeight: "600", fontSize: 16, color: colors.agoraText, paddingHorizontal: 14, paddingTop: 10 },
    description: { fontSize: 14, color: colors.agoraMuted, paddingHorizontal: 14, paddingTop: 4 },
    meta: { fontSize: 12, color: colors.agoraDim, paddingHorizontal: 14, paddingTop: 4 },
    lastMeta: { paddingBottom: 10 },
    organizerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingTop: 8,
      paddingBottom: 4,
    },
    organizerText: { fontSize: 12, color: colors.agoraMuted },
  });
