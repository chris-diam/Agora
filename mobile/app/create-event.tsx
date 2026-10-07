import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { apiFetch } from "../lib/api";
import { detectLocation, type DetectedLocation } from "../lib/geolocation";
import { fonts, type Palette } from "../lib/theme";

const CATEGORIES = ["MUSIC", "CONCERT", "ART", "EXHIBITION", "THEATRE", "CINEMA", "FESTIVAL", "CULTURE", "OTHER"];

interface CreatedEvent {
  id: string;
}

export default function CreateEventScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("MUSIC");
  const [startAt, setStartAt] = useState<Date | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [location, setLocation] = useState<DetectedLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<"detecting" | "detected" | "fallback" | "unavailable">(
    "detecting",
  );

  useEffect(() => {
    (async () => {
      const detected = await detectLocation();
      if (detected) {
        setLocation(detected);
        setLocationStatus("detected");
      } else if (user?.city && user?.country) {
        setLocation({ city: user.city, country: user.country, latitude: 0, longitude: 0 });
        setLocationStatus("fallback");
      } else {
        setLocationStatus("unavailable");
      }
    })();
    // Runs once on mount — re-detecting on every user refetch would
    // re-trigger a location prompt unnecessarily.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (!title.trim() || !description.trim()) {
      setError("Please fill in the title and description.");
      return;
    }
    if (!location) {
      setError("We couldn't detect your location. Add a city/country on your profile and try again.");
      return;
    }
    if (!startAt) {
      setError("Please pick a date and time.");
      return;
    }
    const startDate = startAt;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("category", category);
      formData.append("city", location.city);
      formData.append("country", location.country);
      if (location.latitude) formData.append("latitude", String(location.latitude));
      if (location.longitude) formData.append("longitude", String(location.longitude));
      formData.append("startDate", startDate.toISOString());
      if (imageUri) {
        const fileName = imageUri.split("/").pop() ?? "event.jpg";
        const extension = fileName.split(".").pop()?.toLowerCase();
        const mimeType = extension === "png" ? "image/png" : "image/jpeg";
        formData.append("image", { uri: imageUri, name: fileName, type: mimeType } as unknown as Blob);
      }
      const created = await apiFetch<CreatedEvent>("/events", { method: "POST", body: formData });
      router.replace({ pathname: "/event/[eventId]", params: { eventId: created.id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create this event");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.title}>New event</Text>

      <TextInput
        style={styles.input}
        placeholder="Event title"
        placeholderTextColor={colors.agoraMuted}
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="What's happening?"
        placeholderTextColor={colors.agoraMuted}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
        {CATEGORIES.map((value) => (
          <TouchableOpacity
            key={value}
            style={[styles.categoryChip, category === value && styles.categoryChipActive]}
            onPress={() => setCategory(value)}
          >
            <Text style={[styles.categoryChipText, category === value && styles.categoryChipTextActive]}>
              {value.charAt(0) + value.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {imageUri ? (
        <View style={styles.previewWrap}>
          <Image source={{ uri: imageUri }} style={styles.preview} />
          <TouchableOpacity style={styles.removeImage} onPress={() => setImageUri(null)}>
            <Text style={styles.removeImageText}>Remove</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
          <Text style={styles.addImageText}>Add a cover photo</Text>
        </TouchableOpacity>
      )}

      <View style={styles.locationBlock}>
        <Text style={styles.locationLabel}>Location</Text>
        {locationStatus === "detecting" && <Text style={styles.locationValue}>Detecting your location…</Text>}
        {locationStatus === "detected" && location && (
          <Text style={styles.locationValue}>
            {location.city}, {location.country} (detected)
          </Text>
        )}
        {locationStatus === "fallback" && location && (
          <Text style={styles.locationValue}>
            {location.city}, {location.country} (from your profile)
          </Text>
        )}
        {locationStatus === "unavailable" && (
          <Text style={styles.locationValue}>
            Couldn't detect your location. Add a city/country on your profile to create events.
          </Text>
        )}
      </View>

      <TouchableOpacity style={styles.input} onPress={() => setPickerOpen(true)}>
        <Text style={startAt ? styles.dateValue : styles.datePlaceholder}>
          {startAt ? startAt.toLocaleString() : "Pick a date & time"}
        </Text>
      </TouchableOpacity>
      {pickerOpen && (
        <DateTimePicker
          value={startAt ?? new Date()}
          mode="datetime"
          onChange={(_event, selected) => {
            setPickerOpen(false);
            if (selected) setStartAt(selected);
          }}
        />
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? <ActivityIndicator color={colors.agoraOn} /> : <Text style={styles.submitText}>Create event</Text>}
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
      fontSize: 15,
    },
    textArea: { minHeight: 90, textAlignVertical: "top" },
    dateValue: { color: colors.agoraText, fontSize: 15 },
    datePlaceholder: { color: colors.agoraMuted, fontSize: 15 },
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
    preview: { width: "100%", height: 180, borderRadius: 14 },
    removeImage: { alignSelf: "flex-start" },
    removeImageText: { color: "#f87171", fontSize: 13 },
    locationBlock: {
      borderWidth: 1,
      borderColor: colors.agoraBorder,
      backgroundColor: colors.agoraSurface,
      borderRadius: 12,
      padding: 12,
      gap: 4,
    },
    locationLabel: { fontSize: 11, fontWeight: "700", color: colors.agoraMuted, textTransform: "uppercase" },
    locationValue: { fontSize: 13, color: colors.agoraText },
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
