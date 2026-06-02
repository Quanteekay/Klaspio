import { useState, useCallback } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { getTasksByStudent } from "@/src/services/studentApi";
import { getCurrentUserData } from "@/src/services/userApi";
import { FlatList, StyleSheet } from "react-native";
import { Text } from "@/src/components/Themed";
import FilterBadge from "@/src/components/Student/FilterBadge";
import FilterContainer from "@/src/components/Student/FilterContainer";
import SafeAreaContainer from "@/src/components/SafeAreaContainer";
import ViewTitle from "@/src/components/ViewTitle";
import SingleHomework from "@/src/components/Student/SingleHomework";
import Task from "@/src/models/Task";
import Loader from "@/src/components/Loader";
import SearchBar from "@/src/components/Student/SearchBar";
import { useTheme } from "@/src/theme/useTheme";
import { useRefresh } from "@/src/hooks/useRefresh";
import ThemedRefreshControl from "@/src/components/ui/ThemedRefreshControl";
import EmptyState from "@/src/components/ui/EmptyState";
import { floatingTabBar } from "@/src/theme/layout";

export default function HomeworkPage() {
  const t = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const currentUser = await getCurrentUserData();
      const fetchedTasks = await getTasksByStudent(currentUser.uid);

      fetchedTasks.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });

      setTasks(fetchedTasks);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const isSent = !!task.answerContent;
    const isCommited = !!task.commited;

    const matchesSearch = task.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === "commited") return isCommited;
    if (filter === "sent") return isSent && !isCommited;
    if (filter === "todo") return !isSent;
    return true;
  });

  const handlePressTask = (task: Task) => {
    router.push(`/student/homework/${task.id}`);
  };

  const handleFilter = (newFilter: string | null) => {
    if (filter === newFilter) {
      setFilter(null);
    } else {
      setFilter(newFilter);
    }
  };

  const { refreshing, onRefresh } = useRefresh(fetchData);

  return (
    <SafeAreaContainer>
      <ViewTitle back>Zadania</ViewTitle>
      <FilterContainer>
        <FilterBadge
          title="Zatwierdzone"
          currentFilter={filter}
          filter="commited"
          setFilter={() => handleFilter("commited")}
        />
        <FilterBadge
          title="Oczekujące"
          currentFilter={filter}
          filter="todo"
          setFilter={() => handleFilter("todo")}
        />
        <FilterBadge
          title="Wysłane"
          currentFilter={filter}
          filter="sent"
          setFilter={() => handleFilter("sent")}
        />
      </FilterContainer>
      <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      {loading ? (
        <Loader />
      ) : (
        <FlatList
          refreshControl={
            <ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SingleHomework
              task={item}
              onPressAnswer={() => handlePressTask(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState message="Brak zadań domowych." />}
        />
      )}
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: floatingTabBar.contentBottomPadding,
  },
});
