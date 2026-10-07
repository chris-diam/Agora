import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Avatar } from "../../components/Avatar";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { apiFetch, resolveMediaUrl } from "../../lib/api";
import { fonts, type Palette } from "../../lib/theme";

interface Organizer {
  id: string;
  displayName: string;
  profileImageUrl: string | null;
}

interface EventDetail {
  id: string;
  title: string;
  description: string;
  city: string;
  country: string;
  venueName: string | null;
  address: string | null;
  startDate: string;
  endDate: string | null;
  imageUrl: string | null;
  attendeesCount: number;
  organizer: Organizer;
  organizerId: string;
  viewerAttendanceStatus?: "INTERESTED" | "GOING" | null;
}

export default function EventDetailScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<EventDetail>(`/events/${eventId}`);
      setEvent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this event");
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const setAttendance = async (status: "INTERESTED" | "GOING") => {
    if (!event || isBusy) return;
    setIsBusy(true);
    const previous = event.viewerAttendanceStatus;
    setEvent({
      ...event,
      viewerAttendanceStatus: status,
      attendeesCount: event.attendeesCount + (previous ? 0 : 1),
    });
    try {
      await apiFetch(`/events/${eventId}/attendance`, { method: "POST", body: JSON.stringify({ status }) });
    } catch {
      setEvent((e) => e && { ...e, viewerAttendanceStatus: previous, attendeesCount: event.attendeesCount });
    } finally {
      setIsBusy(false);
    }
  };

  const clearAttendance = async () => {
    if (!event || isBusy) return;
    setIsBusy(true);
    const previous = event.viewerAttendanceStatus;
    setEvent({ ...event, viewerAttendanceStatus: null, attendeesCount: Math.max(0, event.attendeesCount - 1) });
    try {
      await apiFetch(`/events/${eventId}/attendance`, { method: "DELETE" });
    } catch {
      setEvent((e) => e && { ...e, viewerAttendanceStatus: previous, attendeesCount: event.attendeesCount });
    } finally {
      setIsBusy(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.agora} />
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>{error ?? "Event not found"}</Text>
      </View>
    );
  }

  const imageUrl = resolveMediaUrl(event.imageUrl);
  const isOwnEvent = user?.id === event.organizerId;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: event.title, headerShown: true }} />

      {imageUrl && <Image source={{ uri: imageUrl }} style={styles.media} />}

      <Text style={styles.title}>{event.title}</Text>
      <Text style={styles.meta}>
        {new Date(event.startDate).toLocaleString()}
        {event.endDate ? ` – ${new Date(event.endDate).toLocaleString()}` : ""}
      </Text>
      <Text style={styles.meta}>
        {event.venueName ? `${event.venueName}, ` : ""}
        {event.city}, {event.country}
      </Text>

      <TouchableOpacity
        style={styles.organizerRow}
        onPress={() => router.push({ pathname: "/user/[userId]", params: { userId: event.organizer.id } })}
      >
        <Avatar name={event.organizer.displayName} imageUrl={event.organizer.profileImageUrl} size={32} />
        <Text style={styles.organizerText}>Organized by {event.organizer.displayName}</Text>
      </TouchableOpacity>

      <Text style={styles.description}>{event.description}</Text>
      <Text style={styles.attendeesCount}>{event.attendeesCount} attending</Text>

      {!isOwnEvent && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, event.viewerAttendanceStatus === "INTERESTED" && styles.actionButtonInterested]}
            onPress={() => setAttendance("INTERESTED")}
          >
            <Text
              style={[
                styles.actionButtonText,
                event.viewerAttendanceStatus === "INTERESTED" && styles.actionButtonTextInterested,
              ]}
            >
              Interested
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, event.viewerAttendanceStatus === "GOING" && styles.actionButtonGoing]}
            onPress={() => setAttendance("GOING")}
          >
            <Text
              style={[
                styles.actionButtonText,
                event.viewerAttendanceStatus === "GOING" && { color: colors.agoraOn },
              ]}
            >
              Going
            </Text>
          </TouchableOpacity>
          {event.viewerAttendanceStatus && (
            <TouchableOpacity onPress={clearAttendance}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.agoraBg },
    container: { paddingBottom: 32 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.agoraBg },
    muted: { color: colors.agoraMuted },
    media: { width: "100%", height: 220 },
    title: { fontFamily: fonts.body, fontSize: 22, color: colors.agoraText, paddingHorizontal: 20, marginTop: 16 },
    meta: { fontSize: 13, color: colors.agoraMuted, paddingHorizontal: 20, marginTop: 4 },
    organizerRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, marginTop: 14 },
    organizerText: { fontSize: 13, color: colors.agoraMuted },
    description: { fontSize: 15, color: colors.agoraText, lineHeight: 21, paddingHorizontal: 20, marginTop: 16 },
    attendeesCount: { fontSize: 13, color: colors.agoraDim, paddingHorizontal: 20, marginTop: 10 },
    actionsRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, marginTop: 16 },
    actionButton: {
      borderWidth: 1,
      borderColor: colors.agoraBorder,
      backgroundColor: colors.agoraSurface,
      borderRadius: 999,
      paddingVertical: 9,
      paddingHorizontal: 18,
    },
    actionButtonInterested: { backgroundColor: "#fde68a", borderColor: "#fde68a" },
    actionButtonGoing: { backgroundColor: colors.agora, borderColor: colors.agora },
    actionButtonText: { color: colors.agoraText, fontSize: 13, fontWeight: "600" },
    actionButtonTextInterested: { color: "#92400e" },
    clearText: { color: colors.agoraDim, fontSize: 12, textDecorationLine: "underline" },
  });
