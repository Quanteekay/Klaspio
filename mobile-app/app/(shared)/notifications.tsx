import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import type { Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import SafeAreaContainer from "@/src/components/SafeAreaContainer";
import ViewTitle from "@/src/components/ViewTitle";
import Loader from "@/src/components/Loader";
import Card from "@/src/components/ui/Card";
import Badge from "@/src/components/ui/Badge";
import Button from "@/src/components/ui/Button";
import EmptyState from "@/src/components/ui/EmptyState";
import TextField from "@/src/components/ui/TextField";
import ThemedRefreshControl from "@/src/components/ui/ThemedRefreshControl";
import { auth } from "@/FirebaseConfig";
import {
  createAppNotification,
  getNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/src/services/notificationsCenterApi";
import { getAllUsers, getCurrentUserData } from "@/src/services/userApi";
import type AppNotification from "@/src/models/AppNotification";
import type UserData from "@/src/models/UserData";
import { useRefresh } from "@/src/hooks/useRefresh";
import { useTheme } from "@/src/theme/useTheme";
import { floatingTabBar } from "@/src/theme/layout";

function formatDate(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationsScreen() {
  const t = useTheme();
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [sendToAll, setSendToAll] = useState(true);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const userId = auth.currentUser?.uid ?? "";

  const fetchItems = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [notifications, currentUser, allUsers] = await Promise.all([
        getNotificationsForUser(userId),
        getCurrentUserData(),
        getAllUsers(),
      ]);
      setItems(notifications);
      setIsAdmin(currentUser.role === "admin");
      setUsers(allUsers.filter((user) => user.active && user.uid !== userId));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [fetchItems])
  );

  const { refreshing, onRefresh } = useRefresh(fetchItems);

  const unreadCount = useMemo(
    () => items.filter((item) => !item.readBy.includes(userId)).length,
    [items, userId]
  );

  const openNotification = async (item: AppNotification) => {
    if (!userId) return;
    if (!item.readBy.includes(userId)) {
      await markNotificationRead(item.id, userId);
      setItems((prev) =>
        prev.map((notification) =>
          notification.id === item.id
            ? { ...notification, readBy: [...notification.readBy, userId] }
            : notification
        )
      );
    }
    if (item.relatedPath) {
      router.push(item.relatedPath as Href);
    }
  };

  const markAllRead = async () => {
    if (!userId) return;
    await markAllNotificationsRead(items, userId);
    setItems((prev) =>
      prev.map((item) =>
        item.readBy.includes(userId)
          ? item
          : { ...item, readBy: [...item.readBy, userId] }
      )
    );
  };

  const toggleRecipient = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const resetCompose = () => {
    setTitle("");
    setBody("");
    setSendToAll(true);
    setSelectedUserIds([]);
  };

  const openCompose = () => {
    resetCompose();
    setComposeOpen(true);
  };

  const handleSendAlert = async () => {
    const recipients = sendToAll ? users.map((user) => user.uid) : selectedUserIds;
    if (!title.trim()) return Alert.alert("Uwaga", "Podaj tytuł alertu.");
    if (!body.trim()) return Alert.alert("Uwaga", "Podaj treść alertu.");
    if (recipients.length === 0) {
      return Alert.alert("Uwaga", "Wybierz co najmniej jednego odbiorcę.");
    }

    setSending(true);
    try {
      await createAppNotification({
        type: "admin_message",
        title,
        body,
        targetUserIds: recipients,
        createdBy: userId,
      });
      setComposeOpen(false);
      resetCompose();
      Alert.alert("Sukces", "Alert został wysłany.");
    } catch {
      Alert.alert("Błąd", "Nie udało się wysłać alertu.");
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaContainer>
      <ViewTitle back>
        {`Alerty (${unreadCount})`}
      </ViewTitle>
      <View style={styles.header}>
        {isAdmin ? (
          <Button
            title="Wyślij alert"
            icon="send"
            onPress={openCompose}
            style={styles.primaryAction}
          />
        ) : (
          <Button
            title="Oznacz wszystko"
            variant="secondary"
            onPress={markAllRead}
            disabled={!unreadCount}
            style={styles.primaryAction}
          />
        )}
      </View>

      {loading ? (
        <Loader />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          refreshControl={
            <ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState message="Brak alertów." />}
          renderItem={({ item }) => {
            const unread = !item.readBy.includes(userId);
            return (
              <Pressable onPress={() => openNotification(item)}>
                <Card style={{ marginBottom: 10 }}>
                  <View style={styles.row}>
                    <View
                      style={[
                        styles.icon,
                        {
                          backgroundColor: unread
                            ? t.colors.primarySoft
                            : t.colors.surfaceAlt,
                        },
                      ]}
                    >
                      <Ionicons
                        name={unread ? "notifications" : "notifications-outline"}
                        size={20}
                        color={unread ? t.colors.primary : t.colors.textMuted}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.titleRow}>
                        <Text
                          style={[
                            styles.title,
                            { color: t.colors.textPrimary },
                          ]}
                        >
                          {item.title}
                        </Text>
                        {unread ? <Badge label="Nowe" tone="primary" /> : null}
                      </View>
                      <Text
                        style={[
                          styles.body,
                          { color: t.colors.textSecondary },
                        ]}
                      >
                        {item.body}
                      </Text>
                      <Text style={[styles.date, { color: t.colors.textMuted }]}>
                        {formatDate(item.createdAt)}
                      </Text>
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          }}
        />
      )}

      <Modal
        visible={composeOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setComposeOpen(false)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: t.colors.overlay }]}
          onPress={() => setComposeOpen(false)}
        >
          <Pressable
            style={[styles.modalSheet, { backgroundColor: t.colors.bg }, t.shadows.floating]}
            onPress={(event) => event.stopPropagation()}
          >
            <ScrollView
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.modalTitle, { color: t.colors.textPrimary }]}>
                Wyślij alert
              </Text>
              <View style={{ gap: 14 }}>
                <TextField
                  label="Tytuł"
                  value={title}
                  onChangeText={setTitle}
                  placeholder="np. Ważna informacja"
                />
                <TextField
                  label="Treść"
                  value={body}
                  onChangeText={setBody}
                  placeholder="Treść powiadomienia"
                  multiline
                />

                <View>
                  <Text style={[styles.sectionLabel, { color: t.colors.textSecondary }]}>
                    Odbiorcy
                  </Text>
                  <View style={styles.segmented}>
                    <Pressable
                      onPress={() => setSendToAll(true)}
                      style={[
                        styles.segment,
                        {
                          backgroundColor: sendToAll
                            ? t.colors.primary
                            : t.colors.surfaceAlt,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: sendToAll ? t.colors.onPrimary : t.colors.textSecondary,
                          fontWeight: "800",
                        }}
                      >
                        Wszyscy
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setSendToAll(false)}
                      style={[
                        styles.segment,
                        {
                          backgroundColor: !sendToAll
                            ? t.colors.primary
                            : t.colors.surfaceAlt,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: !sendToAll ? t.colors.onPrimary : t.colors.textSecondary,
                          fontWeight: "800",
                        }}
                      >
                        Wybrani
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {!sendToAll ? (
                  <View style={{ gap: 8 }}>
                    {users.map((user) => {
                      const active = selectedUserIds.includes(user.uid);
                      return (
                        <Pressable
                          key={user.uid}
                          onPress={() => toggleRecipient(user.uid)}
                          style={[
                            styles.userRow,
                            {
                              backgroundColor: active
                                ? t.colors.primarySoft
                                : t.colors.surface,
                              borderColor: active ? t.colors.primary : t.colors.border,
                            },
                          ]}
                        >
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                color: active ? t.colors.primary : t.colors.textPrimary,
                                fontWeight: "800",
                              }}
                            >
                              {user.firstName} {user.surname}
                            </Text>
                            <Text style={{ color: t.colors.textMuted, marginTop: 3 }}>
                              {user.role} · {user.email}
                            </Text>
                          </View>
                          {active ? (
                            <Ionicons name="checkmark-circle" size={22} color={t.colors.primary} />
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={{ color: t.colors.textMuted }}>
                    Alert trafi do {users.length} aktywnych użytkowników.
                  </Text>
                )}

                <View style={styles.modalActions}>
                  <Button
                    title="Anuluj"
                    variant="secondary"
                    fullWidth={false}
                    onPress={() => setComposeOpen(false)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Wyślij"
                    fullWidth={false}
                    loading={sending}
                    onPress={handleSendAlert}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
  },
  primaryAction: { paddingVertical: 12 },
  listContent: {
    padding: 16,
    paddingBottom: floatingTabBar.contentBottomPadding,
  },
  row: { flexDirection: "row", gap: 12 },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  title: { flex: 1, fontSize: 16, fontWeight: "800" },
  body: { marginTop: 6, fontSize: 14, lineHeight: 20 },
  date: { marginTop: 8, fontSize: 12, fontWeight: "600" },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalSheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: "90%",
  },
  modalContent: {
    padding: 20,
    paddingBottom: floatingTabBar.contentBottomPadding,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  segmented: { flexDirection: "row", gap: 8 },
  segment: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  userRow: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
});
