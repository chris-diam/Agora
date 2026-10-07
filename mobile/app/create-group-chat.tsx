import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Avatar } from "../components/Avatar";
import { useTheme } from "../context/ThemeContext";
import { apiFetch } from "../lib/api";
import { fonts, type Palette } from "../lib/theme";

interface Friend {
  id: string;
  displayName: string;
  username: string;
  profileImageUrl: string | null;
}

interface CreatedGroupChat {
  id: string;
}

export default function CreateGroupChatScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<Friend[]>("/friends?page=1&limit=100");
        setFriends(data);
      } catch {
        setFriends([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const toggle = (id: string) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    setError(null);
    if (!name.trim()) {
      setError("Give the group a name.");
      return;
    }
    if (selected.size === 0) {
      setError("Pick at least one friend.");
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await apiFetch<CreatedGroupChat>("/group-chats", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), memberIds: Array.from(selected) }),
      });
      router.replace({ pathname: "/group-chat/[chatId]", params: { chatId: created.id, name: name.trim() } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create this group chat");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.agora} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <TextInput
        style={styles.nameInput}
        placeholder="Group name"
        placeholderTextColor={colors.agoraMuted}
        value={name}
        onChangeText={setName}
      />
      <Text style={styles.sectionLabel}>Add friends</Text>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.muted}>You need at least one mutual-follow friend to start a group chat.</Text>
        }
        renderItem={({ item }) => {
          const isSelected = selected.has(item.id);
          return (
            <TouchableOpacity style={styles.row} onPress={() => toggle(item.id)}>
              <Avatar name={item.displayName} imageUrl={item.profileImageUrl} size={38} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.displayName}</Text>
                <Text style={styles.rowSubtitle}>@{item.username}</Text>
              </View>
              <View style={[styles.checkbox, isSelected && styles.checkboxOn]}>
                {isSelected && <Ionicons name="checkmark" size={14} color={colors.agoraOn} />}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.createButton} onPress={handleCreate} disabled={isSubmitting}>
        {isSubmitting ? (
          <ActivityIndicator color={colors.agoraOn} />
        ) : (
          <Text style={styles.createButtonText}>Create group chat</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.agoraBg, paddingTop: 16 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.agoraBg },
    nameInput: {
      marginHorizontal: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.agoraBorder,
      backgroundColor: colors.agoraSurface,
      borderRadius: 12,
      padding: 12,
      color: colors.agoraText,
      fontSize: 15,
      fontFamily: fonts.body,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.agoraMuted,
      textTransform: "uppercase",
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    list: { paddingHorizontal: 16, paddingBottom: 16 },
    muted: { color: colors.agoraMuted, textAlign: "center", padding: 20 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderColor: colors.agoraBorder,
      backgroundColor: colors.agoraSurface,
      borderRadius: 14,
      padding: 12,
      marginBottom: 8,
    },
    rowTitle: { fontFamily: fonts.body, fontSize: 14, color: colors.agoraText },
    rowSubtitle: { fontSize: 12, color: colors.agoraMuted },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: colors.agoraBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxOn: { backgroundColor: colors.agora, borderColor: colors.agora },
    error: { color: "#f87171", textAlign: "center", marginBottom: 8 },
    createButton: {
      margin: 16,
      backgroundColor: colors.agora,
      borderRadius: 999,
      paddingVertical: 14,
      alignItems: "center",
    },
    createButtonText: { color: colors.agoraOn, fontWeight: "600", fontSize: 16 },
  });
