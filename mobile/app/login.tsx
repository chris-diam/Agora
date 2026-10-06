import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { fonts, type Palette } from "../lib/theme";

export default function LoginScreen() {
  const { login } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(usernameOrEmail, password);
      router.replace("/(tabs)/feed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>KYMA</Text>
      <Text style={styles.subtitle}>Log in to continue</Text>

      <TextInput
        style={styles.input}
        placeholder="Username or email"
        placeholderTextColor={colors.agoraMuted}
        autoCapitalize="none"
        autoCorrect={false}
        value={usernameOrEmail}
        onChangeText={setUsernameOrEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.agoraMuted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? <ActivityIndicator color={colors.agoraOn} /> : <Text style={styles.buttonText}>Log in</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/register")}>
        <Text style={styles.link}>Don't have an account? Create one</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: colors.agoraBg },
    title: {
      fontFamily: fonts.body,
      fontSize: 36,
      color: colors.agoraText,
      textAlign: "center",
      marginBottom: 4,
      letterSpacing: 1,
    },
    subtitle: { fontSize: 14, color: colors.agoraMuted, textAlign: "center", marginBottom: 28 },
    input: {
      borderWidth: 1,
      borderColor: colors.agoraBorder,
      backgroundColor: colors.agoraSurface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      fontSize: 16,
      color: colors.agoraText,
    },
    error: { color: "#f87171", marginBottom: 12, textAlign: "center" },
    button: {
      backgroundColor: colors.agora,
      borderRadius: 999,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 8,
    },
    buttonText: { color: colors.agoraOn, fontWeight: "600", fontSize: 16 },
    link: { color: colors.agora, textAlign: "center", marginTop: 20, fontSize: 14 },
  });
