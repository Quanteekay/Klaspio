import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { SectionList, StyleSheet, Text, View } from "react-native";
import SafeAreaContainer from "@/src/components/SafeAreaContainer";
import ViewTitle from "@/src/components/ViewTitle";
import Loader from "@/src/components/Loader";
import SingleAttendance from "@/src/components/Student/SingleAttendance";
import { useTheme } from "@/src/theme/useTheme";
import { useRefresh } from "@/src/hooks/useRefresh";
import ThemedRefreshControl from "@/src/components/ui/ThemedRefreshControl";
import EmptyState from "@/src/components/ui/EmptyState";
import { getCurrentUserData } from "@/src/services/userApi";
import {
  getAttendanceByStudent,
  getAttendanceStats,
  groupAttendanceByCourse,
  type AttendanceStats,
  type AttendanceSection,
} from "@/src/services/attendanceApi";
import { floatingTabBar } from "@/src/theme/layout";

export default function PresencePage() {
  const t = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sections, setSections] = useState<AttendanceSection[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);

  async function fetchAttendance() {
    setLoading(true);
    setError(null);
    try {
      const user = await getCurrentUserData();
      const records = await getAttendanceByStudent(user.uid);
      setStats(getAttendanceStats(records));
      setSections(groupAttendanceByCourse(records));
    } catch {
      setError("Błąd podczas ładowania obecności.");
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchAttendance();
    }, [])
  );

  const { refreshing, onRefresh } = useRefresh(fetchAttendance);

  return (
    <SafeAreaContainer>
      <ViewTitle back>Obecność</ViewTitle>

      {loading ? (
        <Loader />
      ) : error ? (
        <View style={styles.centered}>
          <Text style={{ color: t.colors.danger, fontSize: 16, fontWeight: "600" }}>
            {error}
          </Text>
        </View>
      ) : (
        <>
          {stats && stats.total > 0 && (
            <View
              style={[
                styles.statsBar,
                { backgroundColor: t.colors.surface, borderColor: t.colors.border },
                t.shadows.card,
              ]}
            >
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: t.colors.primary }]}>
                  {stats.attendedPercent}%
                </Text>
                <Text style={[styles.statLabel, { color: t.colors.textSecondary }]}>
                  Obecności
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: t.colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: t.colors.warning }]}>
                  {stats.late}
                </Text>
                <Text style={[styles.statLabel, { color: t.colors.textSecondary }]}>
                  Spóźnienia
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: t.colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: t.colors.danger }]}>
                  {stats.absent}
                </Text>
                <Text style={[styles.statLabel, { color: t.colors.textSecondary }]}>
                  Nieobecności
                </Text>
              </View>
            </View>
          )}

          <SectionList
            refreshControl={
              <ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <SingleAttendance date={item.date} status={item.status} note={item.note} />
            )}
            renderSectionHeader={({ section }) => (
              <Text style={[styles.sectionHeader, { color: t.colors.textPrimary }]}>
                {section.title}
              </Text>
            )}
            contentContainerStyle={styles.listContent}
            stickySectionHeadersEnabled={false}
            ListEmptyComponent={
              <EmptyState message="Brak zarejestrowanej obecności." />
            }
          />
        </>
      )}
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  statsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginHorizontal: 15,
    marginBottom: 5,
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1,
  },
  statItem: { alignItems: "center", flex: 1 },
  statDivider: { width: 1, height: 32 },
  statValue: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 12, marginTop: 4 },
  listContent: {
    padding: 15,
    paddingTop: 10,
    paddingBottom: floatingTabBar.contentBottomPadding,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 8,
  },
  emptyText: { textAlign: "center", marginTop: 40, fontSize: 16 },
});
