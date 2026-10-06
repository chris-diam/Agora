import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { fonts, type Palette } from "../lib/theme";

export default function RegisterScreen() {
  const { register } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!displayName.trim() || !username.trim() || !email.trim() || !password) {
      setError("Please fill in every field.");
      return;
    }
    if (username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Username must be at least 3 characters: letters, numbers, and underscores only.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setIsSubmitting(true);
    try {
      await register({ displayName: displayName.trim(), username: username.trim(), email: email.trim(), password });
      router.replace("/(tabs)/feed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>KYMA</Text>
        <Text style={styles.subtitle}>Create an account</Text>

        <TextInput
          style={styles.input}
          placeholder="Display name"
          placeholderTextColor={colors.agoraMuted}
          value={displayName}
          onChangeText={setDisplayName}
        />
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor={colors.agoraMuted}
          autoCapitalize="none"
          autoCorrect={false}
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.agoraMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
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
          {isSubmitting ? (
            <ActivityIndicator color={colors.agoraOn} />
          ) : (
            <Text style={styles.buttonText}>Create account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/login")}>
          <Text style={styles.link}>Already have an account? Log in</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.agoraBg },
    scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
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
