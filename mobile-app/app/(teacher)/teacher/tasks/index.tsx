import React, { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import Task from "@/src/models/Task";
import UserData from "@/src/models/UserData";
import { getCurrentUserData } from "@/src/services/userApi";
import {
  getStudents,
  getTasksByTeacher,
  type Student,
} from "@/src/services/tasksApi";
import { auth } from "@/FirebaseConfig";
import CheckAuth from "@/src/components/CheckAuth";
import SafeAreaContainer from "@/src/components/SafeAreaContainer";
import ViewTitle from "@/src/components/ViewTitle";
import Loader from "@/src/components/Loader";
import Card from "@/src/components/ui/Card";
import Badge, { type BadgeTone } from "@/src/components/ui/Badge";
import Button from "@/src/components/ui/Button";
import ThemedRefreshControl from "@/src/components/ui/ThemedRefreshControl";
import { useTheme } from "@/src/theme/useTheme";
import { useRefresh } from "@/src/hooks/useRefresh";
import { floatingTabBar } from "@/src/theme/layout";

function statusOf(task: Task): { label: string; tone: BadgeTone } {
  if (task.commited) return { label: "Zatwierdzone", tone: "success" };
  if (task.rate !== null) return { label: "Ocenione", tone: "warning" };
  return { label: "Do oceny", tone: "danger" };
}

function formatDatePL(date?: string) {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function TeacherTasksList() {
  const router = useRouter();
  const t = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [studentsByUid, setStudentsByUid] = useState<Record<string, Student>>({});

  const loadTasks = async () => {
    try {
      setLoading(true);
      const uid = auth.currentUser?.uid;
      if (!uid) {
        setTasks([]);
        setLoading(false);
        return;
      }
      setTasks(await getTasksByTeacher(uid));
    } catch (error) {
      console.log("Błąd pobierania zadań:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const list = await getStudents();
      const map: Record<string, Student> = {};
      list.forEach((s) => (map[s.uid] = s));
      setStudentsByUid(map);
    } catch (e) {
      console.log("Błąd pobierania studentów:", e);
      setStudentsByUid({});
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setIsCheckingAuth(false);
        return;
      }
      try {
        setUserData(await getCurrentUserData());
      } catch (error) {
        console.log("Error loading user profile:", error);
      } finally {
        setIsCheckingAuth(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (userData?.role === "teacher") {
        loadStudents();
        loadTasks();
      }
    }, [userData])
  );

  const { refreshing, onRefresh } = useRefresh(loadTasks);

  const studentLabel = (uid: string) => {
    const s = studentsByUid[uid];
    const full = s ? `${s.firstName} ${s.surname}`.trim() : "";
    return full ? `Uczeń: ${full}` : "Uczeń: (nieznany)";
  };

  if (isCheckingAuth) return <CheckAuth />;

  if (!userData || userData.role !== "teacher") {
    return (
      <SafeAreaContainer>
        <ViewTitle back>Moje Zadania</ViewTitle>
        <View style={styles.centered}>
          <Text style={{ fontSize: 64, marginBottom: 16 }}>🚫</Text>
          <Text style={{ color: t.colors.textPrimary, fontSize: 22, fontWeight: "700" }}>
            Brak dostępu
          </Text>
          <Text
            style={{
              color: t.colors.textSecondary,
              textAlign: "center",
              marginTop: 8,
              lineHeight: 22,
            }}
          >
            Ten moduł jest dostępny tylko dla nauczycieli.
          </Text>
        </View>
      </SafeAreaContainer>
    );
  }

  if (loading) {
    return (
      <SafeAreaContainer>
        <ViewTitle back>Moje Zadania</ViewTitle>
        <Loader />
      </SafeAreaContainer>
    );
  }

  const pendingTasks = tasks.filter((t) => !t.commited);
  const completedTasks = tasks.filter((t) => t.commited);

  const renderTask = (task: Task, dimmed?: boolean) => {
    const status = statusOf(task);
    return (
      <Pressable
        key={task.id}
        onPress={() =>
          router.push({ pathname: "/teacher/tasks/task", params: { id: task.id } })
        }
        style={({ pressed }) => ({ opacity: pressed ? 0.9 : dimmed ? 0.75 : 1 })}
      >
        <Card style={{ marginBottom: 12 }}>
          <View style={styles.headerRow}>
            <Text
              style={{
                flex: 1,
                color: t.colors.textPrimary,
                fontSize: 16,
                fontWeight: "700",
                marginRight: 10,
              }}
              numberOfLines={2}
            >
              {task.title}
            </Text>
            <Badge label={status.label} tone={status.tone} />
          </View>

          <Text
            style={{
              color: t.colors.textSecondary,
              fontSize: 13,
              marginTop: 6,
              marginBottom: 8,
            }}
          >
            {studentLabel(task.userId)}
          </Text>

          {task.rate !== null && (
            <View
              style={[styles.gradeRow, { borderTopColor: t.colors.border }]}
            >
              <Text style={{ color: t.colors.textSecondary, fontSize: 13 }}>
                Ocena:
              </Text>
              <Text
                style={{ color: t.colors.primary, fontSize: 16, fontWeight: "700" }}
              >
                {" "}
                {task.rate}/100
              </Text>
            </View>
          )}

          <View style={styles.footerRow}>
            <Text style={{ color: t.colors.textMuted, fontSize: 12 }}>
              {formatDatePL(task.date)}
            </Text>
            <Text style={{ color: t.colors.primary, fontSize: 13, fontWeight: "700" }}>
              Zobacz szczegóły →
            </Text>
          </View>
        </Card>
      </Pressable>
    );
  };

  return (
    <SafeAreaContainer>
      <ViewTitle back>Moje Zadania</ViewTitle>

      <View style={styles.subHeader}>
        <Text style={{ color: t.colors.textSecondary, fontSize: 14, fontWeight: "600" }}>
          {pendingTasks.length} do sprawdzenia
        </Text>
        <Button
          title="+ Nowe"
          onPress={() => router.push("/teacher/tasks/create")}
          fullWidth={false}
          style={{ paddingVertical: 10, paddingHorizontal: 16 }}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {pendingTasks.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: t.colors.textPrimary }]}>
              Do sprawdzenia
            </Text>
            {pendingTasks.map((task) => renderTask(task))}
          </>
        )}

        {completedTasks.length > 0 && (
          <>
            <Text
              style={[
                styles.sectionTitle,
                { color: t.colors.textPrimary, marginTop: 8 },
              ]}
            >
              Zatwierdzone
            </Text>
            {completedTasks.map((task) => renderTask(task, true))}
          </>
        )}

        {tasks.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={{ color: t.colors.textMuted, fontSize: 16 }}>
              Brak zadań do sprawdzenia
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  subHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: floatingTabBar.contentBottomPadding,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  gradeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
});
