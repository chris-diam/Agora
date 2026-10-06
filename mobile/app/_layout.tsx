import { useFonts, Wellfleet_400Regular } from "@expo-google-fonts/wellfleet";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ToastOverlay } from "../components/ToastOverlay";
import { AuthProvider } from "../context/AuthContext";
import { SocketProvider } from "../context/SocketContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";

const modalHeaderOptions = (colors: ReturnType<typeof useTheme>["colors"], title?: string) => ({
  headerShown: true,
  headerStyle: { backgroundColor: colors.agoraBg },
  headerTintColor: colors.agoraText,
  ...(title ? { title } : {}),
});

function RootNavigation() {
  const { colors } = useTheme();
  return (
    <AuthProvider>
      <SocketProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="chat/[userId]" options={modalHeaderOptions(colors)} />
          <Stack.Screen name="user/[userId]" options={modalHeaderOptions(colors, "Profile")} />
          <Stack.Screen name="group/[groupId]" options={modalHeaderOptions(colors)} />
          <Stack.Screen name="messages" options={modalHeaderOptions(colors, "Messages")} />
          <Stack.Screen name="notifications" options={modalHeaderOptions(colors, "Notifications")} />
          <Stack.Screen name="search" options={modalHeaderOptions(colors, "Search")} />
          <Stack.Screen name="create-post" options={modalHeaderOptions(colors, "New post")} />
          <Stack.Screen name="create-group" options={modalHeaderOptions(colors, "New group")} />
        </Stack>
        <ToastOverlay />
        <StatusBar style="light" />
      </SocketProvider>
    </AuthProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Wellfleet_400Regular });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#02222e" }}>
        <ActivityIndicator color="#53a1c9" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootNavigation />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
