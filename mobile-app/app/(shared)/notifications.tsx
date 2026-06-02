import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
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
import ThemedRefreshControl from "@/src/components/ui/ThemedRefreshControl";
import { auth } from "@/FirebaseConfig";
import {
  getNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/src/services/notificationsCenterApi";
import type AppNotification from "@/src/models/AppNotification";
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
  const [loading, setLoading] = useState(false);
  const userId = auth.currentUser?.uid ?? "";

  const fetchItems = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      setItems(await getNotificationsForUser(userId));
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

  return (
    <SafeAreaContainer>
      <ViewTitle back>Alerty</ViewTitle>
      <View style={styles.header}>
        <Badge
          label={unreadCount ? `${unreadCount} nowych` : "Brak nowych"}
          tone={unreadCount ? "danger" : "neutral"}
        />
        <Button
          title="Oznacz wszystko"
          variant="secondary"
          fullWidth={false}
          onPress={markAllRead}
          disabled={!unreadCount}
          style={{ paddingVertical: 10, paddingHorizontal: 14 }}
        />
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
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
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
});
