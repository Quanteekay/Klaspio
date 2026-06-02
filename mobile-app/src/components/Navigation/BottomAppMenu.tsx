import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router, usePathname, type Href } from "expo-router";
import { auth } from "@/FirebaseConfig";
import { getCurrentUserData } from "@/src/services/userApi";
import { subscribeToUnreadMessageCount } from "@/src/services/chatApi";
import { subscribeToUnreadNotificationCount } from "@/src/services/notificationsCenterApi";
import type { UserRole } from "@/src/models/UserRole";
import { floatingTabBar } from "@/src/theme/layout";
import { useTheme } from "@/src/theme/useTheme";

type MenuRole = Exclude<UserRole, "guest" | null>;

const DASHBOARD_ROUTES: Record<MenuRole, string> = {
  admin: "/(admin)/admin",
  teacher: "/(teacher)/teacher",
  student: "/(student)/student",
  parent: "/(parent)/parent",
};

const PROFILE_ROUTES: Record<MenuRole, Href> = {
  admin: "/(admin)/admin/(tabs)/profile",
  teacher: "/(teacher)/teacher/(tabs)/profile",
  student: "/(student)/student/(tabs)/profile",
  parent: "/(parent)/parent/(tabs)/profile",
};

function formatBadge(count: number): string {
  if (count > 99) return "99+";
  return String(count);
}

function isMenuRole(role: UserRole): role is MenuRole {
  return role === "admin" || role === "teacher" || role === "student" || role === "parent";
}

export default function BottomAppMenu() {
  const t = useTheme();
  const pathname = usePathname();
  const [role, setRole] = useState<MenuRole | null>(null);
  const [userId, setUserId] = useState(auth.currentUser?.uid ?? "");
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    return auth.onAuthStateChanged((user) => {
      setUserId(user?.uid ?? "");
      if (!user) {
        setRole(null);
        setNotificationCount(0);
        setMessageCount(0);
      }
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    let mounted = true;
    getCurrentUserData()
      .then((user) => {
        if (mounted && isMenuRole(user.role)) setRole(user.role);
      })
      .catch(() => {
        if (mounted) setRole(null);
      });
    return () => {
      mounted = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const unsubNotifications = subscribeToUnreadNotificationCount(
      userId,
      setNotificationCount
    );
    const unsubMessages = subscribeToUnreadMessageCount(userId, setMessageCount);
    return () => {
      unsubNotifications();
      unsubMessages();
    };
  }, [userId]);

  const items = useMemo(() => {
    if (!role) return [];
    return [
      {
        key: "dashboard",
        label: "Dashboard",
        icon: "home" as const,
        href: DASHBOARD_ROUTES[role],
        active: pathname === `/${role}`,
      },
      {
        key: "notifications",
        label: "Alerty",
        icon: "notifications" as const,
        href: "/notifications" as Href,
        count: notificationCount,
        active: pathname.startsWith("/notifications"),
      },
      {
        key: "messages",
        label: "Wiadomości",
        icon: "chat-bubble" as const,
        href: "/chat" as Href,
        count: messageCount,
        active: pathname.startsWith("/chat"),
      },
      {
        key: "profile",
        label: "Profil",
        icon: "person" as const,
        href: PROFILE_ROUTES[role],
        active: pathname.includes("/profile"),
      },
    ];
  }, [messageCount, notificationCount, pathname, role]);

  if (!role || items.length === 0) return null;

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: t.scheme === "dark" ? "#181A21" : "#FFFFFF",
            borderColor: t.colors.border,
          },
          t.shadows.floating,
        ]}
      >
        {items.map((item) => {
          const active = item.active;
          return (
            <Pressable
              key={item.key}
              onPress={() => router.push(item.href as Href)}
              style={[
                styles.item,
                active && { backgroundColor: t.colors.primarySoft },
              ]}
            >
              <View>
                <MaterialIcons
                  name={item.icon}
                  size={24}
                  color={active ? t.colors.primary : t.colors.textMuted}
                />
                {item.count ? (
                  <View style={[styles.badge, { backgroundColor: t.colors.danger }]}>
                    <Text style={styles.badgeText}>{formatBadge(item.count)}</Text>
                  </View>
                ) : null}
              </View>
              <Text
                style={[
                  styles.label,
                  { color: active ? t.colors.primary : t.colors.textSecondary },
                ]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: floatingTabBar.margin,
    right: floatingTabBar.margin,
    bottom: floatingTabBar.margin,
    zIndex: 50,
  },
  bar: {
    minHeight: floatingTabBar.height,
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  item: {
    flex: 1,
    minHeight: 56,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
  },
  badge: {
    position: "absolute",
    top: -8,
    right: -12,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
});
