import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AppHeader } from "./AppHeader";
import { useTheme } from "../context/ThemeContext";
import { fonts, type Palette } from "../lib/theme";
import type { FeedType } from "../lib/feed";

const PILLS: { value: FeedType; label: string; icon?: keyof typeof Ionicons.glyphMap }[] = [
  { value: "following", label: "Following" },
  { value: "chronological", label: "Chronological" },
  { value: "interests", label: "Interests" },
  { value: "local", label: "Local", icon: "location-outline" },
];

interface Props {
  feedType: FeedType;
  onChangeFeedType: (type: FeedType) => void;
  showReasons: boolean;
  onToggleReasons: () => void;
  city: string;
}

export function FeedTuningHeader({ feedType, onChangeFeedType, showReasons, onToggleReasons, city }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [tuneOpen, setTuneOpen] = useState(false);

  const weekday = new Date().toLocaleDateString(undefined, { weekday: "long" }).toUpperCase();

  return (
    <View>
      <AppHeader />

      <TouchableOpacity style={styles.searchBar} onPress={() => router.push("/search")}>
        <Ionicons name="search" size={16} color={colors.agoraMuted} />
        <Text style={styles.searchPlaceholder}>Search people, places, sounds…</Text>
      </TouchableOpacity>

      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>
          {weekday} · {city.toUpperCase()} · LIVE
        </Text>
        <Text style={styles.headline}>What moves you today?</Text>
        <Text style={styles.subtext}>Choose the current. Every story keeps its reason visible.</Text>

        <TouchableOpacity style={styles.tuneButton} onPress={() => setTuneOpen((v) => !v)}>
          <Text style={styles.tuneButtonText}>Tune feed</Text>
          <Ionicons name={tuneOpen ? "chevron-up" : "chevron-down"} size={14} color={colors.agora} />
        </TouchableOpacity>

        {tuneOpen && (
          <TouchableOpacity style={styles.toggleRow} onPress={onToggleReasons}>
            <Text style={styles.toggleLabel}>Explain recommendations</Text>
            <View style={[styles.toggleTrack, showReasons && { backgroundColor: colors.agora }]}>
              <View style={[styles.toggleThumb, showReasons && styles.toggleThumbOn]} />
            </View>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsRow} contentContainerStyle={{ paddingRight: 16 }}>
        {PILLS.map((pill) => {
          const active = feedType === pill.value;
          return (
            <TouchableOpacity
              key={pill.value}
              style={[styles.pill, active && styles.pillActive]}
              onPress={() => onChangeFeedType(pill.value)}
            >
              {pill.icon && (
                <Ionicons name={pill.icon} size={13} color={active ? colors.agoraOn : colors.agoraMuted} />
              )}
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{pill.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginHorizontal: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.agoraBorder,
      backgroundColor: colors.agoraSurface,
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: 11,
    },
    searchPlaceholder: { color: colors.agoraMuted, fontSize: 14 },
    heroCard: {
      marginHorizontal: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.agoraBorder,
      backgroundColor: colors.agoraSurface,
      borderRadius: 20,
      padding: 18,
      gap: 6,
    },
    eyebrow: { fontSize: 11, fontWeight: "700", color: colors.agora, letterSpacing: 0.6 },
    headline: { fontFamily: fonts.body, fontSize: 26, color: colors.agoraText, lineHeight: 32 },
    subtext: { fontSize: 13, color: colors.agoraMuted, lineHeight: 18, marginBottom: 6 },
    tuneButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      alignSelf: "flex-start",
      borderWidth: 1,
      borderColor: colors.agoraBorder,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    tuneButtonText: { color: colors.agora, fontSize: 13, fontWeight: "600" },
    toggleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.agoraBorder,
    },
    toggleLabel: { fontSize: 13, color: colors.agoraMuted },
    toggleTrack: {
      width: 38,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.agoraBorder,
      padding: 2,
      justifyContent: "center",
    },
    toggleThumb: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.agoraSurface },
    toggleThumbOn: { alignSelf: "flex-end" },
    pillsRow: { flexGrow: 0, marginBottom: 16, paddingLeft: 16 },
    pill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderColor: colors.agoraBorder,
      backgroundColor: colors.agoraSurface,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 9,
      marginRight: 8,
    },
    pillActive: { backgroundColor: colors.agora, borderColor: colors.agora },
    pillText: { fontSize: 13, color: colors.agoraMuted },
    pillTextActive: { color: colors.agoraOn, fontWeight: "600" },
  });
