import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useTheme } from "../context/ThemeContext";
import { fonts, THEMES, type Palette } from "../lib/theme";
import { Avatar } from "./Avatar";

// The custom top bar from the redesign — replaces each tab screen's
// default React Navigation header (headerShown: false on the Tabs) so the
// avatar/name, theme switcher, notifications and create button can scroll
// as part of the screen rather than sit in the native header chrome.
export function AppHeader() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { unreadNotificationsCount } = useSocket();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [themePickerOpen, setThemePickerOpen] = useState(false);

  if (!user) return null;

  return (
    <View style={styles.bar}>
      <TouchableOpacity style={styles.identity} onPress={() => router.push("/(tabs)/profile")}>
        <Avatar name={user.displayName} imageUrl={user.profileImageUrl} size={34} />
        <Text style={styles.username}>{user.username}</Text>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.iconButton} onPress={() => setThemePickerOpen(true)}>
          <Ionicons name="color-palette-outline" size={19} color={colors.agoraText} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push("/notifications")}>
          <Ionicons name="notifications-outline" size={19} color={colors.agoraText} />
          {unreadNotificationsCount > 0 && <View style={styles.dot} />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.createButton} onPress={() => router.push("/create-post")}>
          <Ionicons name="add" size={18} color={colors.agoraOn} />
        </TouchableOpacity>
      </View>

      <ThemePickerModal visible={themePickerOpen} onClose={() => setThemePickerOpen(false)} />
    </View>
  );
}

function ThemePickerModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { themeId, colors, setTheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>Theme</Text>
          <View style={styles.swatchRow}>
            {THEMES.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.swatchWrap}
                onPress={() => {
                  setTheme(option.id);
                  onClose();
                }}
              >
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
                <Text style={styles.swatchLabel}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    bar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 12,
      backgroundColor: colors.agoraBg,
    },
    identity: { flexDirection: "row", alignItems: "center", gap: 8 },
    username: { fontFamily: fonts.body, fontSize: 16, color: colors.agoraText },
    actions: { flexDirection: "row", alignItems: "center", gap: 8 },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.agoraBorder,
      backgroundColor: colors.agoraSurface,
      alignItems: "center",
      justifyContent: "center",
    },
    dot: {
      position: "absolute",
      top: 7,
      right: 7,
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: colors.agoraText,
    },
    createButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.agora,
      alignItems: "center",
      justifyContent: "center",
    },
    modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    modalSheet: {
      backgroundColor: colors.agoraSurface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      gap: 16,
    },
    modalTitle: { fontFamily: fonts.body, fontSize: 16, color: colors.agoraText },
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
  });
