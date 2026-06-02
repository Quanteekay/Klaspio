import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { getRatingSubjects, RatingSubject } from "@/src/services/studentApi";
import { getCurrentUserData } from "@/src/services/userApi";
import { StyleSheet, FlatList, View, Text } from "react-native";
import SafeAreaContainer from "@/src/components/SafeAreaContainer";
import SingleGrade from "@/src/components/Student/SingleGrade";
import ViewTitle from "@/src/components/ViewTitle";
import FilterBadge from "@/src/components/Student/FilterBadge";
import FilterContainer from "@/src/components/Student/FilterContainer";
import Loader from "@/src/components/Loader";
import SearchBar from "@/src/components/Student/SearchBar";
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

export default function GradesPage() {
  const t = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RatingSubject[]>();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string | null>(null);
  const [averages, setAverages] = useState<GradesAverages | null>(null);

  async function fetchRatings() {
    setLoading(true);

    try {
      const user = await getCurrentUserData();
      const [subjects, gradesAverages] = await Promise.all([
        getRatingSubjects(user.uid),
        getGradesAveragesForStudent(user.uid),
      ]);
      setData(subjects);
      setAverages(gradesAverages);
    } catch (err) {
      setError("Błąd podczas ładowania ocen.");
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchRatings();
    }, [])
  );

  const { refreshing, onRefresh } = useRefresh(fetchRatings);

  const filteredData = data?.filter((item) => {
    const matchesSearch = item.title
      .toLowerCase()
      .includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === "ocenione") return item.commited;
    if (filter === "oczekujace") return !item.commited;
    return true;
  });

  const toggleFilter = (newFilter: "ocenione" | "oczekujace") => {
    if (filter === newFilter) {
      setFilter(null);
    } else {
      setFilter(newFilter);
    }
  };

  return (
    <SafeAreaContainer>
      <ViewTitle back>Oceny</ViewTitle>
      <FilterContainer>
        <FilterBadge
          title="Ocenione"
          currentFilter={filter}
          filter="ocenione"
          setFilter={() => toggleFilter("ocenione")}
        />
        <FilterBadge
          title="Oczekujące"
          currentFilter={filter}
          filter="oczekujace"
          setFilter={() => toggleFilter("oczekujace")}
        />
      </FilterContainer>
      <SearchBar searchQuery={search} setSearchQuery={setSearch} />
      {averages && (
        <AveragesCard averages={averages} />
      )}
      {loading ? (
        <Loader />
      ) : error ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: t.colors.danger,
              fontSize: 16,
              fontWeight: "600",
              textTransform: "uppercase",
            }}
          >
            {error}
          </Text>
        </View>
      ) : (
        <FlatList
          refreshControl={
            <ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          data={filteredData}
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
      {averages.subjects.length === 0 ? (
        <Text style={{ color: t.colors.textMuted, marginTop: 8 }}>
          Brak zatwierdzonych ocen.
        </Text>
      ) : (
        averages.subjects.map((item) => (
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
        ))
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
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
    fontSize: 22,
    fontWeight: "500",
  },
});
