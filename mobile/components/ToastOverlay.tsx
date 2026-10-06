import { router } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSocket } from "../context/SocketContext";
import { useTheme } from "../context/ThemeContext";
import { fonts, type Palette } from "../lib/theme";

// Renders over everything (mounted once in the root layout) so a
// like/comment/follow notification is visible no matter which screen is
// open, matching the web app's toast behavior for the same events.
export function ToastOverlay() {
  const { toasts, dismissToast } = useSocket();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (toasts.length === 0) return null;

  return (
    <View style={[styles.container, { top: insets.top + 8 }]} pointerEvents="box-none">
      {toasts.map((toast) => (
        <TouchableOpacity
          key={toast.id}
          style={styles.toast}
          onPress={() => {
            dismissToast(toast.id);
            router.push({ pathname: "/user/[userId]", params: { userId: toast.actorId } });
          }}
        >
          <Text style={styles.text}>{toast.text}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      left: 16,
      right: 16,
      gap: 8,
      zIndex: 999,
    },
    toast: {
      backgroundColor: colors.agoraSurface,
      borderWidth: 1,
      borderColor: colors.agoraBorder,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 16,
      shadowColor: "#000",
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    text: { fontFamily: fonts.body, fontSize: 13, color: colors.agoraText },
  });
