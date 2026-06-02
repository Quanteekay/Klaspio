import { useCallback, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import SafeAreaContainer from "@/src/components/SafeAreaContainer";
import ViewTitle from "@/src/components/ViewTitle";
import Loader from "@/src/components/Loader";
import Card from "@/src/components/ui/Card";
import Badge from "@/src/components/ui/Badge";
import Button from "@/src/components/ui/Button";
import { useTheme } from "@/src/theme/useTheme";
import { useRefresh } from "@/src/hooks/useRefresh";
import ThemedRefreshControl from "@/src/components/ui/ThemedRefreshControl";
import { getLessonById } from "@/src/services/lessonsApi";
import { getCurrentUserData, getUserDataByUid } from "@/src/services/userApi";
import type Lesson from "@/src/models/Lesson";
import type UserData from "@/src/models/UserData";
import { floatingTabBar } from "@/src/theme/layout";

function formatDatePL(iso: string): string {
  if (!iso) return "Brak daty";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Brak daty";
  return d.toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

function fullName(u: UserData | null): string {
  if (!u) return "—";
  return `${u.firstName ?? ""} ${u.surname ?? ""}`.trim() || "—";
}

function isFutureLessonDay(iso: string): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d.getTime() > today.getTime();
}

function lessonHasStarted(iso: string): boolean {
  if (!iso) return false;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() <= Date.now();
}

export default function LessonDetails() {
  const t = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [teacher, setTeacher] = useState<UserData | null>(null);
  const [students, setStudents] = useState<UserData[]>([]);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const isOwner =
    !!currentUser &&
    currentUser.role === "teacher" &&
    !!lesson &&
    lesson.teacherId === currentUser.uid;
  const canTeacherEditImplementation =
    isOwner && lessonHasStarted(lesson?.date ?? "");

  const fetchLesson = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    try {
      const [me, found] = await Promise.all([
        getCurrentUserData().catch(() => null),
        getLessonById(id),
      ]);
      setCurrentUser(me);
      if (!found) {
        setNotFound(true);
        return;
      }
      setLesson(found);

      const [teacherData, ...studentResults] = await Promise.all([
        found.teacherId ? getUserDataByUid(found.teacherId) : Promise.resolve(null),
        ...found.studentIds.map((uid) => getUserDataByUid(uid)),
      ]);
      setTeacher(teacherData);
      setStudents(studentResults.filter((s): s is UserData => s !== null));
    } catch {
      Alert.alert("Błąd", "Nie udało się załadować lekcji.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleEdit = () => {
    if (!id) return;
    router.push({ pathname: "/teacher/lessons/new", params: { id } });
  };

  useFocusEffect(
    useCallback(() => {
      fetchLesson();
    }, [fetchLesson])
  );

  const { refreshing, onRefresh } = useRefresh(fetchLesson);

  const openMeetingUrl = async () => {
    if (!lesson?.meetingUrl) return;
    try {
      await Linking.openURL(lesson.meetingUrl);
    } catch {
      Alert.alert("Błąd", "Nie udało się otworzyć linku.");
    }
  };

  if (loading && !lesson) {
    return (
      <SafeAreaContainer>
        <ViewTitle back>Lekcja</ViewTitle>
        <Loader />
      </SafeAreaContainer>
    );
  }

  if (notFound || !lesson) {
    return (
      <SafeAreaContainer>
        <ViewTitle back>Lekcja</ViewTitle>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={64} color={t.colors.textMuted} />
          <Text style={[styles.notFoundText, { color: t.colors.textMuted }]}>
            Nie znaleziono lekcji.
          </Text>
        </View>
      </SafeAreaContainer>
    );
  }

  return (
    <SafeAreaContainer>
      <ViewTitle back>Lekcja</ViewTitle>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Card style={{ marginBottom: 12 }}>
          <Text style={[styles.label, { color: t.colors.textMuted }]}>Temat</Text>
          <Text style={[styles.topic, { color: t.colors.textPrimary }]}>
            {lesson.topic || "—"}
          </Text>
          {lesson.courseId ? (
            <Text style={[styles.subtitle, { color: t.colors.textSecondary }]}>
              {lesson.courseId}
            </Text>
          ) : null}
        </Card>

        <Card style={{ marginBottom: 12 }}>
          <Row label="Data" value={formatDatePL(lesson.date)} t={t} />
          <Row label="Godzina" value={formatTime(lesson.date)} t={t} />
          {lesson.durationMin ? (
            <Row label="Czas trwania" value={`${lesson.durationMin} min`} t={t} />
          ) : null}
        </Card>

        <Card style={{ marginBottom: 12 }}>
          <View style={styles.headerRow}>
            <Text style={[styles.label, { color: t.colors.textMuted }]}>
              {lesson.online ? "Spotkanie online" : "Lokalizacja"}
            </Text>
            {lesson.online ? (
              <Badge label="Online" tone="success" />
            ) : (
              <Badge label="Stacjonarnie" tone="neutral" />
            )}
          </View>
          {lesson.online ? (
            lesson.meetingUrl ? (
              <Pressable onPress={openMeetingUrl}>
                <Text
                  style={[styles.link, { color: t.colors.info }]}
                  numberOfLines={2}
                >
                  {lesson.meetingUrl}
                </Text>
              </Pressable>
            ) : (
              <Text style={[styles.value, { color: t.colors.textMuted }]}>
                Brak linku
              </Text>
            )
          ) : (
            <Text style={[styles.value, { color: t.colors.textPrimary }]}>
              {lesson.location || "Nieokreślona"}
            </Text>
          )}
        </Card>

        <Card style={{ marginBottom: 12 }}>
          <Text style={[styles.label, { color: t.colors.textMuted }]}>Nauczyciel</Text>
          <Text style={[styles.value, { color: t.colors.textPrimary }]}>
            {fullName(teacher)}
          </Text>
        </Card>

        <Card style={{ marginBottom: 12 }}>
          <View style={styles.headerRow}>
            <Text style={[styles.label, { color: t.colors.textMuted }]}>
              Uczniowie
            </Text>
            <Badge label={`${lesson.studentIds.length}`} tone="primary" />
          </View>
          {students.length === 0 ? (
            <Text style={[styles.value, { color: t.colors.textMuted }]}>
              Brak przypisanych uczniów.
            </Text>
          ) : (
            students.map((s) => (
              <View
                key={s.uid}
                style={[styles.studentRow, { borderTopColor: t.colors.border }]}
              >
                <Ionicons
                  name="person-outline"
                  size={16}
                  color={t.colors.textSecondary}
                />
                <Text
                  style={{ color: t.colors.textPrimary, fontSize: 15 }}
                  numberOfLines={1}
                >
                  {fullName(s)}
                </Text>
              </View>
            ))
          )}
        </Card>

        {isOwner && (
          <>
            {isFutureLessonDay(lesson.date) ? (
              <Card style={{ marginTop: 6, marginBottom: 0 }}>
                <Text
                  style={{
                    color: t.colors.textMuted,
                    fontSize: 14,
                    fontWeight: "500",
                    textAlign: "center",
                  }}
                >
                  Frekwencję będzie można sprawdzić w dniu lekcji.
                </Text>
              </Card>
            ) : (
              <Button
                title="Sprawdź obecność"
                icon="checkmark-done"
                onPress={() =>
                  router.push({
                    pathname: "/teacher/attendance/[lessonId]",
                    params: { lessonId: id! },
                  })
                }
                style={{ marginTop: 6 }}
              />
            )}
            <View style={{ flexDirection: "row", gap: 12, marginTop: 10 }}>
              <Button
                title="Uzupełnij realizację"
                variant="secondary"
                fullWidth={false}
                onPress={handleEdit}
                disabled={!canTeacherEditImplementation}
                style={{ flex: 1 }}
                icon="pencil"
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaContainer>
  );
}

function Row({
  label,
  value,
  t,
}: {
  label: string;
  value: string;
  t: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.row}>
      <Text style={{ color: t.colors.textSecondary, fontSize: 14 }}>{label}</Text>
      <Text
        style={{ color: t.colors.textPrimary, fontSize: 15, fontWeight: "600" }}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingBottom: floatingTabBar.contentBottomPadding,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 14,
  },
  notFoundText: { fontSize: 16, fontWeight: "500" },
  label: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  topic: { fontSize: 22, fontWeight: "800", marginTop: 6 },
  subtitle: { fontSize: 14, marginTop: 4 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  value: { fontSize: 16, fontWeight: "500", marginTop: 4 },
  link: { fontSize: 15, fontWeight: "600", marginTop: 4 },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
});
