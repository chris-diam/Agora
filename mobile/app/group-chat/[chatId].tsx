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

interface Sender {
  id: string;
  displayName: string;
}

interface GroupMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: Sender;
}

export default function GroupChatScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { chatId, name } = useLocalSearchParams<{ chatId: string; name?: string }>();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const listRef = useRef<FlatList>(null);

  const loadMessages = useCallback(
    async (showSpinner: boolean) => {
      if (showSpinner) setIsLoading(true);
      try {
        const data = await apiFetch<GroupMessage[]>(`/group-chats/${chatId}/messages`);
        setMessages([...data].reverse());
      } catch {
        if (showSpinner) setMessages([]);
      } finally {
        if (showSpinner) setIsLoading(false);
      }
    },
    [chatId],
  );

  useEffect(() => {
    loadMessages(true);
  }, [loadMessages]);

  useFocusEffect(
    useCallback(() => {
      loadMessages(false);
    }, [loadMessages]),
  );

  useEffect(() => {
    if (!socket) return;
    const handler = (message: GroupMessage & { groupChatId: string }) => {
      if (message.groupChatId !== chatId) return;
      setMessages((previous) => (previous.some((m) => m.id === message.id) ? previous : [...previous, message]));
    };
    socket.on("group-message:new", handler);
    return () => {
      socket.off("group-message:new", handler);
    };
  }, [socket, chatId]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content) return;
    setDraft("");
    try {
      const sent = await apiFetch<GroupMessage>(`/group-chats/${chatId}/messages`, {
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
      <Stack.Screen options={{ title: name ?? "Group chat", headerShown: true }} />

      {isLoading ? (
        <Text style={styles.status}>Loading…</Text>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={<Text style={styles.status}>Say hello to start the group chat.</Text>}
          renderItem={({ item }) => {
            const isMine = item.senderId === user?.id;
            return (
              <View style={[styles.bubbleRow, isMine && styles.bubbleRowMine]}>
                <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  {!isMine && <Text style={styles.senderName}>{item.sender.displayName}</Text>}
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
    senderName: { fontSize: 11, fontWeight: "700", color: colors.agora, marginBottom: 2 },
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
