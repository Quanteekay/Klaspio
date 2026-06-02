import { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ChatUserList from "@/src/components/Chat/ChatUserList";
import SafeAreaContainer from "@/src/components/SafeAreaContainer";
import ViewTitle from "@/src/components/ViewTitle";
import { auth } from "@/FirebaseConfig";
import {
  markConversationRead,
  sendMessage,
  subscribeToConversation,
} from "@/src/services/chatApi";
import type ChatMessage from "@/src/models/ChatMessage";
import { useTheme } from "@/src/theme/useTheme";
import { floatingTabBar } from "@/src/theme/layout";

function formatMessageDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TabChatScreen() {
  const t = useTheme();
  const { id, title } = useLocalSearchParams<{ id?: string; title?: string }>();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const currentUserId = auth.currentUser?.uid ?? "";

  useEffect(() => {
    if (!id || !currentUserId) return;
    return subscribeToConversation(
      currentUserId,
      id,
      setMessages,
      setError
    );
  }, [currentUserId, id]);

  useEffect(() => {
    if (!id || !currentUserId || messages.length === 0) return;
    markConversationRead(currentUserId, id, messages).catch(() => {
      setError("Nie udało się oznaczyć wiadomości jako przeczytane.");
    });
  }, [currentUserId, id, messages]);

  useEffect(() => {
    if (messages.length === 0) return;
    const timeout = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(timeout);
  }, [messages.length]);

  const canSend = useMemo(() => body.trim().length > 0 && !!id, [body, id]);

  const handleSend = async () => {
    if (!id || !currentUserId || !canSend) return;
    const nextBody = body;
    setBody("");
    try {
      await sendMessage(currentUserId, id, nextBody);
    } catch {
      setBody(nextBody);
      setError("Nie udało się wysłać wiadomości.");
    }
  };

  if (!id) return <ChatUserList />;

  return (
    <SafeAreaContainer>
      <ViewTitle back>{title || "Rozmowa"}</ViewTitle>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {error ? (
          <Text style={[styles.error, { color: t.colors.danger }]}>{error}</Text>
        ) : null}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => {
            if (messages.length > 0) {
              listRef.current?.scrollToEnd({ animated: true });
            }
          }}
          renderItem={({ item }) => {
            const mine = item.senderId === currentUserId;
            return (
              <View
                style={[
                  styles.bubble,
                  {
                    alignSelf: mine ? "flex-end" : "flex-start",
                    backgroundColor: mine ? t.colors.primary : t.colors.surface,
                    borderColor: t.colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: mine ? t.colors.onPrimary : t.colors.textPrimary,
                    fontSize: 15,
                    lineHeight: 21,
                  }}
                >
                  {item.body}
                </Text>
                <Text
                  style={[
                    styles.messageDate,
                    {
                      color: mine
                        ? "rgba(255,255,255,0.78)"
                        : t.colors.textMuted,
                    },
                  ]}
                >
                  {formatMessageDate(item.createdAt)}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: t.colors.textMuted }]}>
              Brak wiadomości. Napisz pierwszą.
            </Text>
          }
        />
        <View
          style={[
            styles.composerWrap,
            t.shadows.floating,
            { backgroundColor: t.colors.surface, borderColor: t.colors.border },
          ]}
        >
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Napisz wiadomość..."
            placeholderTextColor={t.colors.textMuted}
            style={[
              styles.input,
              {
                color: t.colors.textPrimary,
                backgroundColor: t.colors.surfaceAlt,
              },
            ]}
            multiline
          />
          <Pressable
            disabled={!canSend}
            onPress={handleSend}
            style={({ pressed }) => [
              styles.sendButton,
              {
                backgroundColor: canSend ? t.colors.primary : t.colors.surfaceAlt,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Ionicons
              name="send"
              size={18}
              color={canSend ? t.colors.onPrimary : t.colors.textMuted}
            />
          </Pressable>
        </View>
        <View
          style={[
            styles.composer,
            { height: floatingTabBar.contentBottomPadding - floatingTabBar.margin },
          ]}
        />
      </KeyboardAvoidingView>
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  messages: {
    padding: 16,
    paddingBottom: 84,
    gap: 8,
    flexGrow: 1,
  },
  bubble: {
    maxWidth: "82%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  messageDate: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 6,
    alignSelf: "flex-end",
  },
  empty: { textAlign: "center", marginTop: 30 },
  error: { textAlign: "center", paddingVertical: 8, fontWeight: "700" },
  composerWrap: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 24,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  composer: {
    width: "100%",
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 118,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    textAlignVertical: "center",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
