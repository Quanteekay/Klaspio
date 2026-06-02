import { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import SafeAreaContainer from "@/src/components/SafeAreaContainer";
import ViewTitle from "@/src/components/ViewTitle";
import Loader from "@/src/components/Loader";
import Card from "@/src/components/ui/Card";
import Badge, { type BadgeTone } from "@/src/components/ui/Badge";
import { getTasksByStudent } from "@/src/services/studentApi";
import type Task from "@/src/models/Task";
import { useChild } from "@/src/hooks/useChild";
import { useTheme } from "@/src/theme/useTheme";
import { useRefresh } from "@/src/hooks/useRefresh";
import ThemedRefreshControl from "@/src/components/ui/ThemedRefreshControl";
import EmptyState from "@/src/components/ui/EmptyState";
import { floatingTabBar } from "@/src/theme/layout";

function statusOf(task: Task): { label: string; tone: BadgeTone } {
  if (task.commited) return { label: "Zatwierdzone", tone: "info" };
  if (task.answerContent) return { label: "Wysłane", tone: "success" };
  return { label: "Do zrobienia", tone: "warning" };
}

export default function ParentHomework() {
  const t = useTheme();
  const { childId } = useLocalSearchParams<{ childId?: string }>();
  const child = useChild(childId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  async function fetchData() {
    if (!childId) return;
    setLoading(true);
    setError(null);
    try {
      const fetched = await getTasksByStudent(childId);
      fetched.sort((a, b) => {
        const da = a.date ? new Date(a.date).getTime() : 0;
        const db = b.date ? new Date(b.date).getTime() : 0;
        return db - da;
      });
      setTasks(fetched);
    } catch {
      setError("Błąd podczas ładowania zadań.");
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

  const renderItem = ({ item }: { item: Task }) => {
    const status = statusOf(item);
    return (
      <Card style={{ marginBottom: 10 }}>
        <View style={styles.cardHeader}>
          <Text
            style={[styles.cardTitle, { color: t.colors.textPrimary }]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <Badge label={status.label} tone={status.tone} />
        </View>

        {item.taskContent ? (
          <Text style={[styles.taskContent, { color: t.colors.textSecondary }]}>
            {item.taskContent}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          <Text style={[styles.meta, { color: t.colors.textSecondary }]}>
            Ocena: {item.rate !== null ? `${item.rate}/100` : "—"}
          </Text>
          <Text style={[styles.meta, { color: t.colors.textSecondary }]}>
            Odpowiedź: {item.answerContent ? "tak" : "brak"}
          </Text>
        </View>

        {item.comment ? (
          <View
            style={[styles.commentBox, { backgroundColor: t.colors.infoSoft }]}
          >
            <Text style={[styles.commentLabel, { color: t.colors.info }]}>
              Komentarz nauczyciela
            </Text>
            <Text style={[styles.commentText, { color: t.colors.textPrimary }]}>
              {item.comment}
            </Text>
          </View>
        ) : null}
      </Card>
    );
  };

  return (
    <SafeAreaContainer>
      <ViewTitle back>Zadania</ViewTitle>
      {child && (
        <Text style={[styles.childName, { color: t.colors.primary }]}>
          {child.firstName} {child.surname}
        </Text>
      )}

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
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState message="Brak zadań domowych." />}
        />
      )}
    </SafeAreaContainer>
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
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 10,
  },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: "700" },
  taskContent: { fontSize: 14, lineHeight: 20, marginBottom: 10 },
  metaRow: { flexDirection: "row", justifyContent: "space-between" },
  meta: { fontSize: 13, fontWeight: "600" },
  commentBox: { marginTop: 10, borderRadius: 10, padding: 10 },
  commentLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    fontWeight: "700",
    marginBottom: 3,
  },
  commentText: { fontSize: 13, fontStyle: "italic" },
  emptyText: { textAlign: "center", marginTop: 40, fontSize: 16 },
});
