import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { apiFetch } from "../lib/api";
import { fonts, type Palette } from "../lib/theme";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "GENERAL", label: "General" },
  { value: "LOCAL_NEWS", label: "Local news" },
  { value: "NATIONAL_NEWS", label: "National news" },
  { value: "WORLD_NEWS", label: "World news" },
  { value: "MUSIC", label: "Music" },
  { value: "ART", label: "Art" },
  { value: "CULTURE", label: "Culture" },
  { value: "THEATRE", label: "Theatre" },
  { value: "CINEMA", label: "Cinema" },
  { value: "TECHNOLOGY", label: "Technology" },
  { value: "SCIENCE", label: "Science" },
];

export default function CreatePostScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { category: initialCategory } = useLocalSearchParams<{ category?: string }>();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(initialCategory ?? "GENERAL");
  const isNewsCategory = category === "LOCAL_NEWS" || category === "NATIONAL_NEWS" || category === "WORLD_NEWS";
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Photo library permission was denied.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!content.trim()) {
      setError("Write something first.");
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("content", content.trim());
      formData.append("category", category);
      if (isNewsCategory && title.trim()) formData.append("title", title.trim());
      if (imageUri) {
        const fileName = imageUri.split("/").pop() ?? "post.jpg";
        const extension = fileName.split(".").pop()?.toLowerCase();
        const mimeType = extension === "png" ? "image/png" : "image/jpeg";
        // React Native's fetch/FormData accepts this {uri, name, type} shape
        // in place of a real File/Blob — there's no File constructor here.
        formData.append("media", { uri: imageUri, name: fileName, type: mimeType } as unknown as Blob);
      }
      await apiFetch("/posts", { method: "POST", body: formData });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not publish this post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.title}>New post</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
        {CATEGORIES.map((item) => (
          <TouchableOpacity
            key={item.value}
            style={[styles.categoryChip, category === item.value && styles.categoryChipActive]}
            onPress={() => setCategory(item.value)}
          >
            <Text style={[styles.categoryChipText, category === item.value && styles.categoryChipTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isNewsCategory && (
        <TextInput
          style={styles.input}
          placeholder="Headline (optional — makes this an article)"
          placeholderTextColor={colors.agoraMuted}
          value={title}
          onChangeText={setTitle}
        />
      )}

      <TextInput
        style={styles.textArea}
        placeholder={isNewsCategory ? "Write the full story…" : "What's happening?"}
        placeholderTextColor={colors.agoraMuted}
        value={content}
        onChangeText={setContent}
        multiline
      />

      {imageUri ? (
        <View style={styles.previewWrap}>
          <Image source={{ uri: imageUri }} style={styles.preview} />
          <TouchableOpacity style={styles.removeImage} onPress={() => setImageUri(null)}>
            <Text style={styles.removeImageText}>Remove</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
          <Text style={styles.addImageText}>Add a photo</Text>
        </TouchableOpacity>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? <ActivityIndicator color={colors.agoraOn} /> : <Text style={styles.submitText}>Publish</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.agoraBg },
    container: { padding: 20, gap: 14 },
    title: { fontFamily: fonts.body, fontSize: 20, color: colors.agoraText },
    input: {
      borderWidth: 1,
      borderColor: colors.agoraBorder,
      backgroundColor: colors.agoraSurface,
      borderRadius: 12,
      padding: 12,
      color: colors.agoraText,
      fontSize: 16,
      fontFamily: fonts.body,
    },
    textArea: {
      minHeight: 100,
      borderWidth: 1,
      borderColor: colors.agoraBorder,
      backgroundColor: colors.agoraSurface,
      borderRadius: 14,
      padding: 14,
      color: colors.agoraText,
      fontSize: 15,
      textAlignVertical: "top",
    },
    categoryRow: { flexGrow: 0 },
    categoryChip: {
      borderWidth: 1,
      borderColor: colors.agoraBorder,
      backgroundColor: colors.agoraSurface,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 8,
      marginRight: 8,
    },
    categoryChipActive: { backgroundColor: colors.agora, borderColor: colors.agora },
    categoryChipText: { fontSize: 13, color: colors.agoraMuted },
    categoryChipTextActive: { color: colors.agoraOn, fontWeight: "600" },
    addImageButton: {
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: colors.agoraBorder,
      borderRadius: 14,
      paddingVertical: 18,
      alignItems: "center",
    },
    addImageText: { color: colors.agoraMuted, fontSize: 14 },
    previewWrap: { gap: 8 },
    preview: { width: "100%", height: 200, borderRadius: 14 },
    removeImage: { alignSelf: "flex-start" },
    removeImageText: { color: "#f87171", fontSize: 13 },
    error: { color: "#f87171", textAlign: "center" },
    submitButton: {
      backgroundColor: colors.agora,
      borderRadius: 999,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 4,
    },
    submitText: { color: colors.agoraOn, fontWeight: "600", fontSize: 16 },
  });
