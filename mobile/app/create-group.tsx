import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { apiFetch } from "../lib/api";
import { fonts, type Palette } from "../lib/theme";

interface CreatedCommunity {
  id: string;
}

export default function CreateGroupScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim()) {
      setError("Give your community a name.");
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await apiFetch<CreatedCommunity>("/communities", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          city: city.trim() || undefined,
        }),
      });
      router.replace({ pathname: "/group/[groupId]", params: { groupId: created.id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create this community");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.title}>New group</Text>

      <TextInput
        style={styles.input}
        placeholder="Name"
        placeholderTextColor={colors.agoraMuted}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="What's this community about? (optional)"
        placeholderTextColor={colors.agoraMuted}
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <TextInput
        style={styles.input}
        placeholder="City (optional)"
        placeholderTextColor={colors.agoraMuted}
        value={city}
        onChangeText={setCity}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? <ActivityIndicator color={colors.agoraOn} /> : <Text style={styles.submitText}>Create</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.agoraBg },
    container: { padding: 20, gap: 12 },
    title: { fontFamily: fonts.body, fontSize: 20, color: colors.agoraText, marginBottom: 4 },
    input: {
      borderWidth: 1,
      borderColor: colors.agoraBorder,
      backgroundColor: colors.agoraSurface,
      borderRadius: 12,
      padding: 12,
      color: colors.agoraText,
      fontSize: 15,
    },
    textArea: { minHeight: 90, textAlignVertical: "top" },
    error: { color: "#f87171", textAlign: "center" },
    submitButton: { backgroundColor: colors.agora, borderRadius: 999, paddingVertical: 14, alignItems: "center" },
    submitText: { color: colors.agoraOn, fontWeight: "600", fontSize: 16 },
  });
