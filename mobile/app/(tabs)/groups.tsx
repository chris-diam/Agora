import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppHeader } from "../../components/AppHeader";
import { useTheme } from "../../context/ThemeContext";
import { apiFetch } from "../../lib/api";
import { fonts, type Palette } from "../../lib/theme";

interface CommunityItem {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  country: string | null;
  membersCount: number;
  isMember?: boolean;
}

export default function GroupsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [communities, setCommunities] = useState<CommunityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<CommunityItem[]>("/communities?page=1&limit=30");
      setCommunities(data);
    } catch {
      setCommunities([]);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await load();
      setIsLoading(false);
    })();
  }, [load]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  };

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.list}
      data={communities}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.agora} />}
      ListHeaderComponent={
        <View>
          <AppHeader />
          <View style={styles.titleRow}>
            <View>
              <Text style={styles.title}>Groups</Text>
              <Text style={styles.subtitle}>Communities built around a place, scene, or interest.</Text>
            </View>
            <TouchableOpacity style={styles.createButton} onPress={() => router.push("/create-group")}>
              <Ionicons name="add" size={18} color={colors.agoraOn} />
            </TouchableOpacity>
          </View>
        </View>
      }
      ListEmptyComponent={!isLoading ? <Text style={styles.status}>No communities yet.</Text> : null}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push({ pathname: "/group/[groupId]", params: { groupId: item.id } })}
        >
          <View style={styles.cardIcon}>
            <Ionicons name="people" size={20} color={colors.agora} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            {Boolean(item.description) && (
              <Text style={styles.cardDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            <Text style={styles.cardMeta}>
              {item.membersCount} members{item.city ? ` · ${item.city}` : ""}
            </Text>
          </View>
          {item.isMember && (
            <View style={styles.memberBadge}>
              <Text style={styles.memberBadgeText}>Joined</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    />
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.agoraBg },
    list: { paddingBottom: 24 },
    titleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      marginBottom: 16,
      gap: 12,
    },
    title: { fontFamily: fonts.body, fontSize: 22, color: colors.agoraText },
    subtitle: { fontSize: 13, color: colors.agoraMuted, marginTop: 2, maxWidth: 260 },
    createButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.agora,
      alignItems: "center",
      justifyContent: "center",
    },
    status: { padding: 24, textAlign: "center", color: colors.agoraMuted },
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginHorizontal: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.agoraBorder,
      backgroundColor: colors.agoraSurface,
      borderRadius: 16,
      padding: 12,
    },
    cardIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.agoraBg,
      alignItems: "center",
      justifyContent: "center",
    },
    cardText: { flex: 1, gap: 2 },
    cardTitle: { fontFamily: fonts.body, fontSize: 15, color: colors.agoraText },
    cardDescription: { fontSize: 12, color: colors.agoraMuted },
    cardMeta: { fontSize: 11, color: colors.agoraDim },
    memberBadge: {
      borderWidth: 1,
      borderColor: colors.agoraBorder,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    memberBadgeText: { fontSize: 10, color: colors.agoraMuted, fontWeight: "600" },
  });
