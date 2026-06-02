import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import SafeAreaContainer from "@/src/components/SafeAreaContainer";
import ViewTitle from "@/src/components/ViewTitle";
import Badge from "@/src/components/ui/Badge";
import Button from "@/src/components/ui/Button";
import Card from "@/src/components/ui/Card";
import EmptyState from "@/src/components/ui/EmptyState";
import UserData from "@/src/models/UserData";
import { UserRole } from "@/src/models/UserRole";
import type ChatMessage from "@/src/models/ChatMessage";
import { getAllUsers, getCurrentUserData } from "@/src/services/userApi";
import {
  subscribeToUnreadMessageCountsByUser,
  subscribeToUserMessages,
} from "@/src/services/chatApi";
import { floatingTabBar } from "@/src/theme/layout";
import { useTheme } from "@/src/theme/useTheme";

type Mode = "inbox" | "compose";

interface ConversationItem {
  user: UserData;
  lastMessage: ChatMessage;
}

const ROLE_LABELS: Record<Exclude<UserRole, null>, string> = {
  admin: "Administrator",
  teacher: "Nauczyciel",
  student: "Uczeń",
  parent: "Rodzic",
  guest: "Gość",
};

export default function ChatUserList() {
  const t = useTheme();
  const [mode, setMode] = useState<Mode>("inbox");
  const [users, setUsers] = useState<UserData[]>([]);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsubscribeMessages = subscribeToUserMessages(
      currentUser.uid,
      setMessages,
      setError
    );
    const unsubscribeCounts = subscribeToUnreadMessageCountsByUser(
      currentUser.uid,
      setUnreadCounts
    );
    return () => {
      unsubscribeMessages();
      unsubscribeCounts();
    };
  }, [currentUser?.uid]);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await getCurrentUserData();
      const allUsers = await getAllUsers();
      setCurrentUser(me);
      setUsers(allUsers);
    } catch {
      setError("Nie udało się pobrać wiadomości.");
    } finally {
      setLoading(false);
    }
  };

  const usersById = useMemo(() => {
    const map: Record<string, UserData> = {};
    users.forEach((user) => {
      map[user.uid] = user;
    });
    return map;
  }, [users]);

  const conversations = useMemo<ConversationItem[]>(() => {
    if (!currentUser) return [];

    const latestByUser: Record<string, ChatMessage> = {};
    messages.forEach((message) => {
      const otherId =
        message.senderId === currentUser.uid ? message.receiverId : message.senderId;
      if (!otherId) return;

      const current = latestByUser[otherId];
      if (
        !current ||
        new Date(message.createdAt).getTime() > new Date(current.createdAt).getTime()
      ) {
        latestByUser[otherId] = message;
      }
    });

    return Object.entries(latestByUser)
      .map(([userId, lastMessage]) => {
        const user = usersById[userId];
        if (!user) return null;
        return { user, lastMessage };
      })
      .filter((item): item is ConversationItem => item !== null)
      .sort(
        (a, b) =>
          new Date(b.lastMessage.createdAt).getTime() -
          new Date(a.lastMessage.createdAt).getTime()
      );
  }, [currentUser, messages, usersById]);

  const allowedContacts = useMemo(() => {
    if (!currentUser) return [];
    const term = searchText.trim().toLowerCase();
    return users
      .filter(
        (user) =>
          user.active &&
          user.uid !== currentUser.uid &&
          canContactRoleFor(currentUser.role, user.role)
      )
      .filter((user) => {
        if (!term) return true;
        return `${user.firstName} ${user.surname} ${user.email}`
          .toLowerCase()
          .includes(term);
      })
      .sort((a, b) =>
        `${a.firstName} ${a.surname}`.localeCompare(`${b.firstName} ${b.surname}`)
      );
  }, [currentUser, searchText, users]);

  const openChat = (user: UserData) => {
    router.push({
      pathname: "/chat",
      params: {
        id: user.uid,
        title: `${user.firstName} ${user.surname}`,
      },
    });
  };

  const renderAvatar = (user: UserData) => (
    <View style={[styles.avatar, { backgroundColor: t.colors.primarySoft }]}>
      <Text style={[styles.avatarText, { color: t.colors.primary }]}>
        {user.firstName.charAt(0)}
        {user.surname.charAt(0)}
      </Text>
    </View>
  );

  const renderConversation = ({ item }: { item: ConversationItem }) => {
    const unread = unreadCounts[item.user.uid] ?? 0;
    const mine = item.lastMessage.senderId === currentUser?.uid;
    return (
      <Pressable onPress={() => openChat(item.user)}>
        <Card compact style={styles.rowCard}>
          {renderAvatar(item.user)}
          <View style={styles.rowBody}>
            <View style={styles.rowTop}>
              <Text style={[styles.name, { color: t.colors.textPrimary }]}>
                {item.user.firstName} {item.user.surname}
              </Text>
              <Text style={[styles.time, { color: t.colors.textMuted }]}>
                {formatDate(item.lastMessage.createdAt)}
              </Text>
            </View>
            <Text
              style={[
                styles.preview,
                { color: unread ? t.colors.textPrimary : t.colors.textSecondary },
                unread > 0 && { fontWeight: "800" },
              ]}
              numberOfLines={1}
            >
              {mine ? "Ty: " : ""}
              {item.lastMessage.body}
            </Text>
            <Badge
              label={roleLabel(item.user.role)}
              tone={item.user.role === "admin" ? "danger" : "neutral"}
              style={{ marginTop: 8 }}
            />
          </View>
          {unread ? (
            <View style={[styles.unreadBadge, { backgroundColor: t.colors.danger }]}>
              <Text style={styles.unreadText}>{unread > 99 ? "99+" : unread}</Text>
            </View>
          ) : (
            <MaterialIcons name="chevron-right" size={24} color={t.colors.textMuted} />
          )}
        </Card>
      </Pressable>
    );
  };

  const renderContact = ({ item }: { item: UserData }) => {
    const hasConversation = conversations.some(
      (conversation) => conversation.user.uid === item.uid
    );
    return (
      <Pressable onPress={() => openChat(item)}>
        <Card compact style={styles.rowCard}>
          {renderAvatar(item)}
          <View style={styles.rowBody}>
            <Text style={[styles.name, { color: t.colors.textPrimary }]}>
              {item.firstName} {item.surname}
            </Text>
            <Text style={[styles.preview, { color: t.colors.textSecondary }]}>
              {item.email}
            </Text>
            <View style={styles.badges}>
              <Badge label={roleLabel(item.role)} />
              {hasConversation ? <Badge label="Istniejący czat" tone="info" /> : null}
            </View>
          </View>
          <MaterialIcons name="chat-bubble-outline" size={24} color={t.colors.primary} />
        </Card>
      </Pressable>
    );
  };

  return (
    <SafeAreaContainer>
      <ViewTitle back>Wiadomości</ViewTitle>
      <View style={styles.content}>
        <View style={styles.headerActions}>
          <Button
            title={mode === "inbox" ? "Nowa wiadomość" : "Istniejące czaty"}
            icon={mode === "inbox" ? "create-outline" : "chatbubbles-outline"}
            onPress={() => {
              setMode((prev) => (prev === "inbox" ? "compose" : "inbox"));
              setSearchText("");
            }}
          />
        </View>

        {mode === "compose" ? (
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Szukaj osoby..."
            placeholderTextColor={t.colors.textMuted}
            style={[
              styles.searchInput,
              {
                backgroundColor: t.colors.surface,
                borderColor: t.colors.border,
                color: t.colors.textPrimary,
              },
            ]}
          />
        ) : null}

        {error ? (
          <Text style={[styles.errorText, { color: t.colors.danger }]}>
            {error}
          </Text>
        ) : null}

        {loading ? (
          <ActivityIndicator color={t.colors.primary} style={{ marginTop: 20 }} />
        ) : mode === "inbox" ? (
          <FlatList
            data={conversations}
            renderItem={renderConversation}
            keyExtractor={(item) => item.user.uid}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <EmptyState message="Brak rozmów. Użyj przycisku Nowa wiadomość, aby rozpocząć czat." />
            }
          />
        ) : (
          <FlatList
            data={allowedContacts}
            renderItem={renderContact}
            keyExtractor={(item) => item.uid}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<EmptyState message="Nie znaleziono kontaktów." />}
          />
        )}
      </View>
    </SafeAreaContainer>
  );
}

function canContactRoleFor(currentRole: UserRole, otherRole: UserRole): boolean {
  if (!currentRole || !otherRole || currentRole === "guest" || otherRole === "guest") {
    return false;
  }
  if (currentRole === "admin") {
    return otherRole === "teacher" || otherRole === "student" || otherRole === "parent";
  }
  if (currentRole === "teacher") {
    return otherRole === "admin" || otherRole === "student" || otherRole === "parent";
  }
  if (currentRole === "student" || currentRole === "parent") {
    return otherRole === "admin" || otherRole === "teacher";
  }
  return false;
}

function roleLabel(role: UserRole): string {
  if (!role) return "Użytkownik";
  return ROLE_LABELS[role] ?? "Użytkownik";
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 16 },
  headerActions: { marginBottom: 12 },
  searchInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: floatingTabBar.contentBottomPadding,
    gap: 10,
  },
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 17,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  name: { fontSize: 16, fontWeight: "800", flex: 1 },
  time: { fontSize: 12, fontWeight: "600" },
  preview: { fontSize: 14, marginTop: 4 },
  badges: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 8,
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 7,
  },
  unreadText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  errorText: {
    textAlign: "center",
    fontWeight: "700",
    paddingVertical: 10,
  },
});
