import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Avatar } from "../components/Avatar";
import { useTheme } from "../context/ThemeContext";
import { apiFetch } from "../lib/api";
import { fonts, type Palette } from "../lib/theme";

interface UserResult {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl: string | null;
}

interface CommunityResult {
  id: string;
  name: string;
  membersCount: number;
}

export default function SearchScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserResult[]>([]);
  const [communities, setCommunities] = useState<CommunityResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      setUsers([]);
      setCommunities([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await apiFetch<{ users: UserResult[]; communities: CommunityResult[] }>(
          `/search?q=${encodeURIComponent(trimmed)}`,
        );
        setUsers(data.users);
        setCommunities(data.communities);
      } catch {
        setUsers([]);
        setCommunities([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const rows = [
    ...users.map((u) => ({ kind: "user" as const, data: u })),
    ...communities.map((c) => ({ kind: "community" as const, data: c })),
  ];

  return (
    <View style={styles.screen}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={colors.agoraMuted} />
        <TextInput
          style={styles.input}
          placeholder="Search people, places, sounds…"
          placeholderTextColor={colors.agoraMuted}
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
        {isLoading && <ActivityIndicator color={colors.agora} size="small" />}
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => `${item.kind}-${item.data.id}`}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          query.trim().length > 0 && !isLoading ? (
            <Text style={styles.status}>No results for "{query}".</Text>
          ) : null
        }
        renderItem={({ item }) =>
          item.kind === "user" ? (
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push({ pathname: "/user/[userId]", params: { userId: item.data.id } })}
            >
              <Avatar name={item.data.displayName} imageUrl={item.data.profileImageUrl} size={38} />
              <View>
                <Text style={styles.rowTitle}>{item.data.displayName}</Text>
                <Text style={styles.rowSubtitle}>@{item.data.username}</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push({ pathname: "/group/[groupId]", params: { groupId: item.data.id } })}
            >
              <View style={styles.groupIcon}>
                <Ionicons name="people" size={18} color={colors.agora} />
              </View>
              <View>
                <Text style={styles.rowTitle}>{item.data.name}</Text>
                <Text style={styles.rowSubtitle}>{item.data.membersCount} members</Text>
              </View>
            </TouchableOpacity>
          )
        }
      />
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.agoraBg, paddingTop: 12 },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginHorizontal: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.agoraBorder,
      backgroundColor: colors.agoraSurface,
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    input: { flex: 1, color: colors.agoraText, fontSize: 15, fontFamily: fonts.body },
    list: { paddingHorizontal: 16, gap: 8 },
    status: { padding: 24, textAlign: "center", color: colors.agoraMuted },
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
    groupIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.agoraBg,
      alignItems: "center",
      justifyContent: "center",
    },
  });
