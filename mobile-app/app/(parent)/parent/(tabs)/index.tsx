import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import type { Href } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import SafeAreaContainer from "@/src/components/SafeAreaContainer";
import ViewTitle from "@/src/components/ViewTitle";
import Loader from "@/src/components/Loader";
import { getCurrentUserData, getUserDataByUid } from "@/src/services/userApi";
import { useTheme } from "@/src/theme/useTheme";
import { useRefresh } from "@/src/hooks/useRefresh";
import ThemedRefreshControl from "@/src/components/ui/ThemedRefreshControl";
import type UserData from "@/src/models/UserData";
import { floatingTabBar } from "@/src/theme/layout";

type ParentTilePath =
  | "/parent/grades"
  | "/parent/attendance"
  | "/parent/homework"
  | "/parent/calendar"
  | "/content";

type Tile = {
  label: string;
  desc: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  pathname: ParentTilePath;
};

const TILES: Tile[] = [
  {
    label: "Oceny",
    desc: "Podgląd ocen dziecka",
    icon: "grade",
    color: "#22C55E",
    pathname: "/parent/grades",
  },
  {
    label: "Frekwencja",
    desc: "Obecność dziecka",
    icon: "check-circle",
    color: "#A855F7",
    pathname: "/parent/attendance",
  },
  {
    label: "Zadania",
    desc: "Zadania domowe dziecka",
    icon: "book",
    color: "#3B82F6",
    pathname: "/parent/homework",
  },
  {
    label: "Kalendarz",
    desc: "Plan zajęć dziecka",
    icon: "event",
    color: "#F59E0B",
    pathname: "/parent/calendar",
  },
  {
    label: "Materiały",
    desc: "Materiały i galeria szkoły",
    icon: "perm-media",
    color: "#06B6D4",
    pathname: "/content",
  },
];

export default function ParentDashboard() {
  const router = useRouter();
  const t = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [children, setChildren] = useState<UserData[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  async function fetchChildren() {
    setLoading(true);
    setError(null);
    try {
      const parent = await getCurrentUserData();
      const ids = parent.children ?? [];
      const loaded = await Promise.all(ids.map((id) => getUserDataByUid(id)));
      const valid = loaded.filter((c): c is UserData => c !== null);
      setChildren(valid);
      setSelectedChildId((prev) =>
        prev && valid.some((c) => c.uid === prev) ? prev : valid[0]?.uid ?? null
      );
    } catch {
      setError("Błąd podczas ładowania danych dzieci.");
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchChildren();
    }, [])
  );

  const { refreshing, onRefresh } = useRefresh(fetchChildren);

  const openTile = (pathname: ParentTilePath) => {
    if (pathname === "/content") {
      router.push(pathname as Href);
      return;
    }
    if (!selectedChildId) return;
    router.push({ pathname, params: { childId: selectedChildId } });
  };

  return (
    <SafeAreaContainer>
      <ViewTitle>Panel rodzica</ViewTitle>

      {loading ? (
        <Loader />
      ) : error ? (
        <View style={styles.centered}>
          <Text style={{ color: t.colors.danger, fontSize: 16, fontWeight: "600" }}>
            {error}
          </Text>
        </View>
      ) : children.length === 0 ? (
        <View style={styles.centered}>
          <MaterialIcons
            name="family-restroom"
            size={80}
            color={t.colors.textMuted}
          />
          <Text
            style={[styles.emptyTitle, { color: t.colors.textPrimary }]}
          >
            Brak przypisanych dzieci
          </Text>
          <Text
            style={[styles.emptySub, { color: t.colors.textSecondary }]}
          >
            Poproś administratora o powiązanie konta z uczniem.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {children.length > 1 ? (
            <View style={styles.selectorWrap}>
              <Text
                style={[styles.selectorLabel, { color: t.colors.textSecondary }]}
              >
                Wybierz dziecko
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
              >
                {children.map((child) => {
                  const active = child.uid === selectedChildId;
                  return (
                    <Pressable
                      key={child.uid}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 18,
                        borderRadius: 999,
                        backgroundColor: active
                          ? t.colors.primary
                          : t.colors.surfaceAlt,
                      }}
                      onPress={() => setSelectedChildId(child.uid)}
                    >
                      <Text
                        style={{
                          color: active
                            ? t.colors.onPrimary
                            : t.colors.textSecondary,
                          fontSize: 14,
                          fontWeight: "600",
                        }}
                      >
                        {child.firstName} {child.surname}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : (
            <View
              style={[
                styles.singleChildCard,
                {
                  backgroundColor: t.colors.primarySoft,
                  borderColor: t.colors.border,
                },
              ]}
            >
              <MaterialIcons name="person" size={22} color={t.colors.primary} />
              <Text style={[styles.singleChildName, { color: t.colors.primary }]}>
                {children[0].firstName} {children[0].surname}
              </Text>
            </View>
          )}

          <View style={styles.tiles}>
            {TILES.map((tile) => (
              <Pressable
                key={tile.label}
                style={({ pressed }) => [
                  styles.tile,
                  t.shadows.card,
                  {
                    backgroundColor: t.colors.surface,
                    borderColor: t.colors.border,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
                onPress={() => openTile(tile.pathname)}
              >
                <View style={[styles.tileIcon, { backgroundColor: tile.color }]}>
                  <MaterialIcons name={tile.icon} size={26} color="#FFFFFF" />
                </View>
                <View style={styles.tileText}>
                  <Text
                    style={[styles.tileLabel, { color: t.colors.textPrimary }]}
                  >
                    {tile.label}
                  </Text>
                  <Text
                    style={[styles.tileDesc, { color: t.colors.textSecondary }]}
                  >
                    {tile.desc}
                  </Text>
                </View>
                <MaterialIcons
                  name="chevron-right"
                  size={24}
                  color={t.colors.textMuted}
                />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  emptyTitle: { fontSize: 20, fontWeight: "700", marginTop: 16 },
  emptySub: { fontSize: 14, marginTop: 8, textAlign: "center" },
  content: {
    paddingHorizontal: 15,
    paddingBottom: floatingTabBar.contentBottomPadding,
  },
  selectorWrap: { marginBottom: 18 },
  selectorLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  chipsRow: { gap: 10, paddingRight: 10 },
  singleChildCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
  },
  singleChildName: { fontSize: 16, fontWeight: "700" },
  tiles: { gap: 10 },
  tile: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  tileIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  tileText: { flex: 1 },
  tileLabel: { fontSize: 16, fontWeight: "700", marginBottom: 3 },
  tileDesc: { fontSize: 12.5 },
});
