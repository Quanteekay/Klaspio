import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import SafeAreaContainer from "@/src/components/SafeAreaContainer";
import ViewTitle from "@/src/components/ViewTitle";
import NavigationItem, {
  NavigationItemType,
} from "@/src/components/Navigation/NavigationItem";
import Card from "@/src/components/ui/Card";
import ThemedRefreshControl from "@/src/components/ui/ThemedRefreshControl";
import { getAllUsers } from "@/src/services/userApi";
import { useTheme } from "@/src/theme/useTheme";
import { useRefresh } from "@/src/hooks/useRefresh";
import type { Theme } from "@/src/theme/theme";
import { floatingTabBar } from "@/src/theme/layout";

interface Counts {
  total: number;
  admin: number;
  teacher: number;
  student: number;
  parent: number;
}

const ZERO: Counts = { total: 0, admin: 0, teacher: 0, student: 0, parent: 0 };

type RoleKey = "student" | "teacher" | "parent" | "admin";

export default function AdminPanel() {
  const t = useTheme();
  const router = useRouter();
  const [counts, setCounts] = useState<Counts>(ZERO);

  const fetchCounts = useCallback(async () => {
    try {
      const users = await getAllUsers();
      const c: Counts = { ...ZERO, total: users.length };
      for (const u of users) {
        if (u.role === "admin") c.admin++;
        else if (u.role === "teacher") c.teacher++;
        else if (u.role === "student") c.student++;
        else if (u.role === "parent") c.parent++;
      }
      setCounts(c);
    } catch {
      // bez statów dashboard nadal działa
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCounts();
    }, [fetchCounts])
  );

  const { refreshing, onRefresh } = useRefresh(fetchCounts);

  const goToUsers = (role: RoleKey) => {
    router.push({ pathname: "/admin/users", params: { role } });
  };

  return (
    <SafeAreaContainer>
      <ViewTitle>Panel admina</ViewTitle>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Card style={styles.statsCard}>
          <Text style={[styles.statsLabel, { color: t.colors.textMuted }]}>
            Konta łącznie
          </Text>
          <Text style={[styles.statsTotal, { color: t.colors.textPrimary }]}>
            {counts.total}
          </Text>
          <View style={styles.statsRow}>
            <StatBox
              label="Uczniowie"
              value={counts.student}
              color={t.colors.success}
              t={t}
              onPress={() => goToUsers("student")}
            />
            <View style={[styles.statDivider, { backgroundColor: t.colors.border }]} />
            <StatBox
              label="Nauczyciele"
              value={counts.teacher}
              color={t.colors.warning}
              t={t}
              onPress={() => goToUsers("teacher")}
            />
            <View style={[styles.statDivider, { backgroundColor: t.colors.border }]} />
            <StatBox
              label="Rodzice"
              value={counts.parent}
              color={t.colors.primary}
              t={t}
              onPress={() => goToUsers("parent")}
            />
            <View style={[styles.statDivider, { backgroundColor: t.colors.border }]} />
            <StatBox
              label="Admini"
              value={counts.admin}
              color={t.colors.danger}
              t={t}
              onPress={() => goToUsers("admin")}
            />
          </View>
        </Card>

        <View style={styles.tiles}>
          {navigationItems.map(
            ({ label, desc, iconName, iconBackgroundColor, route }) => (
              <NavigationItem
                key={label}
                label={label}
                desc={desc}
                iconName={iconName}
                iconBackgroundColor={iconBackgroundColor}
                route={route}
              />
            )
          )}
        </View>
      </ScrollView>
    </SafeAreaContainer>
  );
}

function StatBox({
  label,
  value,
  color,
  t,
  onPress,
}: {
  label: string;
  value: number;
  color: string;
  t: Theme;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.statBox,
        { opacity: pressed ? 0.6 : 1 },
      ]}
      hitSlop={6}
    >
      <Text style={{ color, fontSize: 22, fontWeight: "800" }}>{value}</Text>
      <Text
        style={{
          color: t.colors.textSecondary,
          fontSize: 11,
          marginTop: 2,
          fontWeight: "600",
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const navigationItems: NavigationItemType[] = [
  {
    label: "Zarządzanie kontami",
    desc: "Konta, role, statusy aktywacji",
    iconName: "people",
    iconBackgroundColor: "#22C55E",
    route: "/admin/users",
  },
  {
    label: "Grupy uczniów",
    desc: "Twórz i edytuj grupy do zadań i lekcji",
    iconName: "groups",
    iconBackgroundColor: "#3B82F6",
    route: "/admin/groups",
  },
  {
    label: "Przedmioty lekcyjne",
    desc: "Dodawaj i edytuj przedmioty",
    iconName: "class",
    iconBackgroundColor: "#F59E0B",
    route: "/admin/subjects",
  },
  {
    label: "Grafik lekcji",
    desc: "Twórz lekcje i przypisuj grupy",
    iconName: "calendar-month",
    iconBackgroundColor: "#8B5CF6",
    route: "/admin/schedule" as unknown as NavigationItemType["route"],
  },
  {
    label: "Materiały i galeria",
    desc: "Zarządzaj linkami, PDF, wideo i zdjęciami",
    iconName: "perm-media",
    iconBackgroundColor: "#06B6D4",
    route: "/admin/content" as unknown as NavigationItemType["route"],
  },
  {
    label: "Alerty",
    desc: "Powiadomienia systemowe i szkolne",
    iconName: "notifications",
    iconBackgroundColor: "#EF4444",
    route: "/notifications" as unknown as NavigationItemType["route"],
  },
  {
    label: "Profil",
    desc: "Dane konta, prywatność i wylogowanie",
    iconName: "person",
    iconBackgroundColor: "#64748B",
    route: "/admin/profile" as unknown as NavigationItemType["route"],
  },
];

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 15,
    paddingBottom: floatingTabBar.contentBottomPadding,
  },
  statsCard: { marginBottom: 16 },
  statsLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statsTotal: { fontSize: 38, fontWeight: "800", marginTop: 4, marginBottom: 14 },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statBox: { alignItems: "center", flex: 1, paddingVertical: 4 },
  statDivider: { width: 1, height: 28 },
  tiles: { gap: 10 },
});
