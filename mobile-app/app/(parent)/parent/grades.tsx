import { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import SafeAreaContainer from "@/src/components/SafeAreaContainer";
import ViewTitle from "@/src/components/ViewTitle";
import Loader from "@/src/components/Loader";
import SingleGrade from "@/src/components/Student/SingleGrade";
import { getRatingSubjects, type RatingSubject } from "@/src/services/studentApi";
import { useChild } from "@/src/hooks/useChild";
import { useTheme } from "@/src/theme/useTheme";
import { useRefresh } from "@/src/hooks/useRefresh";
import ThemedRefreshControl from "@/src/components/ui/ThemedRefreshControl";
import EmptyState from "@/src/components/ui/EmptyState";
import Card from "@/src/components/ui/Card";
import Badge from "@/src/components/ui/Badge";
import {
  formatAverage,
  getGradesAveragesForStudent,
  type GradesAverages,
} from "@/src/services/gradesApi";
import { floatingTabBar } from "@/src/theme/layout";

export default function ParentGrades() {
  const t = useTheme();
  const { childId } = useLocalSearchParams<{ childId?: string }>();
  const child = useChild(childId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RatingSubject[]>([]);
  const [averages, setAverages] = useState<GradesAverages | null>(null);

  async function fetchData() {
    if (!childId) return;
    setLoading(true);
    setError(null);
    try {
      const [ratings, gradesAverages] = await Promise.all([
        getRatingSubjects(childId),
        getGradesAveragesForStudent(childId),
      ]);
      setData(ratings);
      setAverages(gradesAverages);
    } catch {
      setError("Błąd podczas ładowania ocen.");
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [childId])
  );

  const { refreshing, onRefresh } = useRefresh(fetchData);

  return (
    <SafeAreaContainer>
      <ViewTitle back>Oceny</ViewTitle>
      {child && (
        <Text style={[styles.childName, { color: t.colors.primary }]}>
          {child.firstName} {child.surname}
        </Text>
      )}
      {averages && <AveragesCard averages={averages} />}

      {!childId ? (
        <View style={styles.centered}>
          <Text style={{ color: t.colors.textSecondary, fontSize: 16 }}>
            Nie wybrano dziecka.
          </Text>
        </View>
      ) : loading ? (
        <Loader />
      ) : error ? (
        <View style={styles.centered}>
          <Text style={{ color: t.colors.danger, fontSize: 16, fontWeight: "600" }}>
            {error}
          </Text>
        </View>
      ) : (
        <FlatList
          refreshControl={
            <ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          data={data}
          renderItem={({ item }) => <SingleGrade {...item} />}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState message="Brak ocen." />}
        />
      )}
    </SafeAreaContainer>
  );
}

function AveragesCard({ averages }: { averages: GradesAverages }) {
  const t = useTheme();
  return (
    <Card style={{ marginHorizontal: 15, marginBottom: 10 }}>
      <View style={styles.averageHeader}>
        <Text style={[styles.averageTitle, { color: t.colors.textPrimary }]}>
          Średnia ogólna
        </Text>
        <Badge label={formatAverage(averages.overallAverage)} tone="primary" />
      </View>
      {averages.subjects.map((item) => (
        <View
          key={item.subjectId}
          style={[styles.averageRow, { borderTopColor: t.colors.border }]}
        >
          <Text style={{ color: t.colors.textSecondary, flex: 1 }}>
            {item.subjectName}
            {!item.includedInOverall ? " (poza ogólną)" : ""}
          </Text>
          <Text style={{ color: t.colors.textPrimary, fontWeight: "800" }}>
            {formatAverage(item.average)}
          </Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  childName: {
    textAlign: "center",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: {
    padding: 15,
    paddingBottom: floatingTabBar.contentBottomPadding,
    gap: 10,
  },
  averageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  averageTitle: { fontSize: 16, fontWeight: "800" },
  averageRow: {
    borderTopWidth: 1,
    marginTop: 10,
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 18,
    fontWeight: "500",
  },
});
