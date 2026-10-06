import { router } from "expo-router";
import { useMemo } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { resolveMediaUrl } from "../../lib/api";
import { fonts, THEMES, type Palette } from "../../lib/theme";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { themeId, colors, setTheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  if (!user) return null;

  const avatarUrl = resolveMediaUrl(user.profileImageUrl);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarInitial}>{user.displayName.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <Text style={styles.name}>{user.displayName}</Text>
      <Text style={styles.username}>@{user.username}</Text>
      {Boolean(user.city || user.country) && (
        <Text style={styles.location}>{[user.city, user.country].filter(Boolean).join(", ")}</Text>
      )}
      {Boolean(user.bio) && <Text style={styles.bio}>{user.bio}</Text>}

      <TouchableOpacity style={styles.messagesButton} onPress={() => router.push("/messages")}>
        <Text style={styles.messagesButtonText}>Messages</Text>
      </TouchableOpacity>

      <View style={styles.themeSection}>
        <Text style={styles.sectionLabel}>Theme</Text>
        <View style={styles.swatchRow}>
          {THEMES.map((option) => (
            <TouchableOpacity key={option.id} style={styles.swatchWrap} onPress={() => setTheme(option.id)}>
              <View
                style={[
                  styles.swatch,
                  { backgroundColor: option.swatch[0] },
                  themeId === option.id && { borderColor: colors.agora, borderWidth: 3 },
                ]}
              >
                <View style={[styles.swatchDot, { backgroundColor: option.swatch[1] }]} />
                <View style={[styles.swatchDot, { backgroundColor: option.swatch[2] }]} />
              </View>
              <Text style={[styles.swatchLabel, themeId === option.id && { color: colors.agora }]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.agoraBg },
    container: { alignItems: "center", padding: 24, gap: 6 },
    avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: 12 },
    avatarFallback: { backgroundColor: colors.agora, alignItems: "center", justifyContent: "center" },
    avatarInitial: { color: colors.agoraOn, fontSize: 32, fontWeight: "700" },
    name: { fontFamily: fonts.body, fontSize: 20, color: colors.agoraText },
    username: { fontSize: 14, color: colors.agoraMuted },
    location: { fontSize: 13, color: colors.agoraDim },
    bio: { fontSize: 14, color: colors.agoraMuted, textAlign: "center", marginTop: 8 },
    messagesButton: {
      marginTop: 16,
      borderWidth: 1,
      borderColor: colors.agoraBorder,
      backgroundColor: colors.agoraSurface,
      borderRadius: 999,
      paddingVertical: 10,
      paddingHorizontal: 24,
    },
    messagesButtonText: { color: colors.agoraText, fontWeight: "600" },
    themeSection: { width: "100%", marginTop: 28 },
    sectionLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.agoraMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 12,
    },
    swatchRow: { flexDirection: "row", flexWrap: "wrap", gap: 16, justifyContent: "center" },
    swatchWrap: { alignItems: "center", gap: 6, width: 72 },
    swatch: {
      width: 52,
      height: 52,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: colors.agoraBorder,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },
    swatchDot: { width: 10, height: 10, borderRadius: 5 },
    swatchLabel: { fontSize: 11, color: colors.agoraMuted, textAlign: "center" },
    logoutButton: {
      marginTop: 32,
      borderWidth: 1,
      borderColor: "#f87171",
      borderRadius: 999,
      paddingVertical: 10,
      paddingHorizontal: 24,
    },
    logoutText: { color: "#f87171", fontWeight: "600" },
  });
