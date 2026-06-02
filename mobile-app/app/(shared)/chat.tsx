import { useEffect, useMemo, useState } from "react";
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
import ChatUserList from "@/src/components/Chat/ChatUserList";
import SafeAreaContainer from "@/src/components/SafeAreaContainer";
import ViewTitle from "@/src/components/ViewTitle";
import Button from "@/src/components/ui/Button";
import { auth } from "@/FirebaseConfig";
import {
  markConversationRead,
  sendMessage,
  subscribeToConversation,
} from "@/src/services/chatApi";
import type ChatMessage from "@/src/models/ChatMessage";
import { useTheme } from "@/src/theme/useTheme";
import { floatingTabBar } from "@/src/theme/layout";

export default function TabChatScreen() {
  const t = useTheme();
  const { id, title } = useLocalSearchParams<{ id?: string; title?: string }>();
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
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messages}
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
                  }}
                >
                  {item.body}
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
            styles.composer,
            { backgroundColor: t.colors.surface, borderColor: t.colors.border },
          ]}
        >
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Napisz wiadomość..."
            placeholderTextColor={t.colors.textMuted}
            style={[styles.input, { color: t.colors.textPrimary }]}
            multiline
          />
          <Pressable disabled={!canSend} style={{ opacity: canSend ? 1 : 0.5 }}>
            <Button title="Wyślij" onPress={handleSend} fullWidth={false} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  messages: { padding: 16, paddingBottom: floatingTabBar.contentBottomPadding, gap: 8, flexGrow: 1 },
  bubble: {
    maxWidth: "82%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  empty: { textAlign: "center", marginTop: 30 },
  error: { textAlign: "center", paddingVertical: 8, fontWeight: "700" },
  composer: {
    borderTopWidth: 1,
    padding: 10,
    marginBottom: floatingTabBar.contentBottomPadding - floatingTabBar.margin,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  input: { flex: 1, minHeight: 44, maxHeight: 120, fontSize: 15 },
});
