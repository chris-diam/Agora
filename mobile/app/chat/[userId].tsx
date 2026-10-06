import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { useTheme } from "../../context/ThemeContext";
import { apiFetch } from "../../lib/api";
import { fonts, type Palette } from "../../lib/theme";

interface DirectMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
}

export default function ChatScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { userId, name } = useLocalSearchParams<{ userId: string; name?: string }>();
  const { user } = useAuth();
  const { socket, refreshUnreadCount } = useSocket();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const listRef = useRef<FlatList>(null);

  const loadMessages = useCallback(
    async (showSpinner: boolean) => {
      if (showSpinner) setIsLoading(true);
      try {
        const data = await apiFetch<DirectMessage[]>(`/messages/${userId}`);
        // The backend returns newest-first (for the "last message" preview
        // on the conversations list); a chat view reads top-to-bottom
        // oldest-first, so reverse it here rather than changing the shared
        // endpoint's contract.
        setMessages([...data].reverse());
        // Fetching this conversation marks its messages read server-side —
        // resync the tab-bar badge immediately rather than waiting for the
        // Messages tab to regain focus.
        refreshUnreadCount();
      } catch {
        if (showSpinner) setMessages([]);
      } finally {
        if (showSpinner) setIsLoading(false);
      }
    },
    [userId, refreshUnreadCount],
  );

  useEffect(() => {
    loadMessages(true);
  }, [loadMessages]);

  // Re-fetches (silently, no spinner) whenever this screen regains focus —
  // a safety net for a message that arrived while the socket was
  // reconnecting or this screen wasn't mounted, since the live listener
  // below only catches events delivered while it's attached.
  useFocusEffect(
    useCallback(() => {
      loadMessages(false);
    }, [loadMessages]),
  );

  useEffect(() => {
    if (!socket) return;
    const handler = (message: DirectMessage & { sender: { id: string } }) => {
      if (message.senderId !== userId) return;
      setMessages((previous) => (previous.some((m) => m.id === message.id) ? previous : [...previous, message]));
      refreshUnreadCount();
    };
    socket.on("message:new", handler);
    return () => {
      socket.off("message:new", handler);
    };
  }, [socket, userId, refreshUnreadCount]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content) return;
    setDraft("");
    try {
      const sent = await apiFetch<DirectMessage>(`/messages/${userId}`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      setMessages((previous) => (previous.some((m) => m.id === sent.id) ? previous : [...previous, sent]));
    } catch {
      setDraft(content);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen options={{ title: name ?? "Chat", headerShown: true }} />

      {isLoading ? (
        <Text style={styles.status}>Loading…</Text>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={<Text style={styles.status}>Say hello to start the conversation.</Text>}
          renderItem={({ item }) => {
            const isMine = item.senderId === user?.id;
            return (
              <View style={[styles.bubbleRow, isMine && styles.bubbleRowMine]}>
                <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs}>{item.content}</Text>
                </View>
              </View>
            );
          }}
        />
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Message…"
          placeholderTextColor={colors.agoraMuted}
          value={draft}
          onChangeText={setDraft}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.agoraBg },
    status: { flex: 1, padding: 24, textAlign: "center", color: colors.agoraMuted },
    list: { padding: 16, gap: 8, flexGrow: 1 },
    bubbleRow: { flexDirection: "row", justifyContent: "flex-start" },
    bubbleRowMine: { justifyContent: "flex-end" },
    bubble: { maxWidth: "78%", borderRadius: 16, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 4 },
    bubbleTheirs: { backgroundColor: colors.agoraSurface, borderWidth: 1, borderColor: colors.agoraBorder },
    bubbleMine: { backgroundColor: colors.agora },
    bubbleTextTheirs: { color: colors.agoraText, fontSize: 14 },
    bubbleTextMine: { color: colors.agoraOn, fontSize: 14 },
    inputRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: colors.agoraBorder,
      backgroundColor: colors.agoraSurface,
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.agoraBorder,
      backgroundColor: colors.agoraBg,
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 8,
      color: colors.agoraText,
      maxHeight: 100,
      fontFamily: fonts.body,
    },
    sendButton: { backgroundColor: colors.agora, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10 },
    sendText: { color: colors.agoraOn, fontWeight: "600" },
  });
