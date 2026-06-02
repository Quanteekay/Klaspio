import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import SafeAreaContainer from "@/src/components/SafeAreaContainer";
import ViewTitle from "@/src/components/ViewTitle";
import Loader from "@/src/components/Loader";
import Card from "@/src/components/ui/Card";
import Button from "@/src/components/ui/Button";
import { useTheme } from "@/src/theme/useTheme";
import { auth } from "@/FirebaseConfig";
import { getLessonById } from "@/src/services/lessonsApi";
import { getUserDataByUid } from "@/src/services/userApi";
import {
  getAttendanceByLesson,
  upsertAttendance,
} from "@/src/services/attendanceApi";
import type Lesson from "@/src/models/Lesson";
import type UserData from "@/src/models/UserData";
import type { AttendanceStatus } from "@/src/models/Attendance";
import { floatingTabBar } from "@/src/theme/layout";

type StatusOption = {
  value: AttendanceStatus;
  label: string;
  colorKey: "success" | "warning" | "danger";
};

const STATUSES: StatusOption[] = [
  { value: "present", label: "Obecny", colorKey: "success" },
  { value: "late", label: "Spóźnienie", colorKey: "warning" },
  { value: "absent", label: "Nieobecny", colorKey: "danger" },
];

export default function AttendanceForLesson() {
  const t = useTheme();
  const router = useRouter();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [students, setStudents] = useState<UserData[]>([]);
  const [statusByStudent, setStatusByStudent] = useState<
    Record<string, AttendanceStatus | null>
  >({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notAllowed, setNotAllowed] = useState(false);
  const [tooEarly, setTooEarly] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!lessonId) return;
    setLoading(true);
    setNotAllowed(false);
    setTooEarly(false);
    try {
      const found = await getLessonById(lessonId);
      if (!found) {
        Alert.alert("Błąd", "Nie znaleziono lekcji.");
        router.back();
        return;
      }
      // Tylko nauczyciel‑właściciel może wprowadzać frekwencję dla tej lekcji
      if (auth.currentUser?.uid !== found.teacherId) {
        setNotAllowed(true);
        return;
      }
      // Frekwencję można wprowadzać tylko w dniu lekcji lub dniach przeszłych
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lessonDay = new Date(found.date);
      lessonDay.setHours(0, 0, 0, 0);
      if (lessonDay.getTime() > today.getTime()) {
        setTooEarly(true);
        return;
      }
      setLesson(found);

      const [studentDatas, existing] = await Promise.all([
        Promise.all(found.studentIds.map((uid) => getUserDataByUid(uid))),
        getAttendanceByLesson(lessonId),
      ]);
      const valid = studentDatas.filter((s): s is UserData => s !== null);
      setStudents(valid);

      const map: Record<string, AttendanceStatus | null> = {};
      for (const s of valid) map[s.uid] = null;
      for (const rec of existing) map[rec.studentId] = rec.status;
      setStatusByStudent(map);
    } catch {
      Alert.alert("Błąd", "Nie udało się załadować frekwencji.");
    } finally {
      setLoading(false);
    }
  }, [lessonId, router]);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll])
  );

  const setStatus = (uid: string, status: AttendanceStatus | null) => {
    setStatusByStudent((prev) => ({ ...prev, [uid]: status }));
  };

  const handleSaveAll = async () => {
    if (!lesson) return;
    const entries = Object.entries(statusByStudent).filter(
      ([, s]) => s !== null
    ) as [string, AttendanceStatus][];
    if (entries.length === 0) {
      Alert.alert("Uwaga", "Zaznacz status przynajmniej jednego ucznia.");
      return;
    }
    setSaving(true);
    try {
      await Promise.all(
        entries.map(([studentId, status]) =>
          upsertAttendance({
            studentId,
            courseId: lesson.courseId,
            lessonId: lesson.id,
            date: lesson.date,
            status,
          })
        )
      );
      Alert.alert("Sukces", "Frekwencja zapisana.");
      router.back();
    } catch {
      Alert.alert("Błąd", "Nie udało się zapisać frekwencji.");
    } finally {
      setSaving(false);
    }
  };

  const markAllPresent = () => {
    setStatusByStudent((prev) => {
      const next: Record<string, AttendanceStatus | null> = {};
      for (const uid of Object.keys(prev)) next[uid] = "present";
      return next;
    });
  };

  if (loading) {
    return (
      <SafeAreaContainer>
        <ViewTitle back>Frekwencja</ViewTitle>
        <Loader />
      </SafeAreaContainer>
    );
  }

  if (notAllowed) {
    return (
      <SafeAreaContainer>
        <ViewTitle back>Frekwencja</ViewTitle>
        <View style={styles.centered}>
          <Text style={{ color: t.colors.danger, fontSize: 20, fontWeight: "700" }}>
            Brak uprawnień
          </Text>
          <Text
            style={{
              color: t.colors.textSecondary,
              textAlign: "center",
              marginTop: 8,
              lineHeight: 22,
            }}
          >
            Tylko nauczyciel prowadzący tę lekcję może wprowadzać frekwencję.
          </Text>
        </View>
      </SafeAreaContainer>
    );
  }

  if (tooEarly) {
    return (
      <SafeAreaContainer>
        <ViewTitle back>Frekwencja</ViewTitle>
        <View style={styles.centered}>
          <Text style={{ color: t.colors.warning, fontSize: 20, fontWeight: "700" }}>
            Lekcja w przyszłości
          </Text>
          <Text
            style={{
              color: t.colors.textSecondary,
              textAlign: "center",
              marginTop: 8,
              lineHeight: 22,
            }}
          >
            Frekwencję można wprowadzać dopiero w dniu lekcji lub później.
          </Text>
        </View>
      </SafeAreaContainer>
    );
  }

  return (
    <SafeAreaContainer>
      <ViewTitle back>Frekwencja</ViewTitle>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {lesson && (
          <Card style={{ marginBottom: 14 }}>
            <Text style={[styles.label, { color: t.colors.textMuted }]}>
              Lekcja
            </Text>
            <Text
              style={{
                color: t.colors.textPrimary,
                fontSize: 18,
                fontWeight: "700",
                marginTop: 4,
              }}
            >
              {lesson.topic || "(bez tematu)"}
            </Text>
            <Text
              style={{
                color: t.colors.textSecondary,
                fontSize: 14,
                marginTop: 2,
              }}
            >
              {new Date(lesson.date).toLocaleString("pl-PL", {
                dateStyle: "long",
                timeStyle: "short",
              })}
            </Text>
          </Card>
        )}

        {students.length === 0 ? (
          <Text
            style={{
              textAlign: "center",
              marginTop: 40,
              fontSize: 16,
              fontWeight: "500",
              color: t.colors.textMuted,
            }}
          >
            Brak uczniów przypisanych do tej lekcji.
          </Text>
        ) : (
          <>
            <View style={{ alignItems: "flex-end", marginBottom: 10 }}>
              <Button
                title="Wszyscy obecni"
                variant="soft"
                fullWidth={false}
                onPress={markAllPresent}
                style={{ paddingHorizontal: 14, paddingVertical: 10 }}
              />
            </View>
            {students.map((s) => {
              const current = statusByStudent[s.uid] ?? null;
              return (
                <Card key={s.uid} style={{ marginBottom: 10 }}>
                  <Text
                    style={{
                      color: t.colors.textPrimary,
                      fontSize: 16,
                      fontWeight: "600",
                      marginBottom: 10,
                    }}
                  >
                    {s.firstName} {s.surname}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {STATUSES.map((opt) => {
                      const active = current === opt.value;
                      const fg = t.colors[opt.colorKey];
                      const bg = active ? fg : t.colors.surfaceAlt;
                      return (
                        <Pressable
                          key={opt.value}
                          onPress={() =>
                            setStatus(s.uid, active ? null : opt.value)
                          }
                          style={{
                            flex: 1,
                            paddingVertical: 10,
                            paddingHorizontal: 8,
                            borderRadius: 10,
                            backgroundColor: bg,
                            alignItems: "center",
                            borderWidth: 1,
                            borderColor: active ? fg : t.colors.border,
                          }}
                        >
                          <Text
                            style={{
                              color: active ? "#FFFFFF" : t.colors.textSecondary,
                              fontWeight: "700",
                              fontSize: 13,
                            }}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Card>
              );
            })}
            <Button
              title="Zapisz frekwencję"
              onPress={handleSaveAll}
              loading={saving}
              style={{ marginTop: 14 }}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 15,
    paddingBottom: floatingTabBar.contentBottomPadding,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
