import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Task from "@/src/models/Task";
import UserData from "@/src/models/UserData";
import { getCurrentUserData } from "@/src/services/userApi";
import {
  getStudentByUid,
  getTaskById,
  updateTaskGradeAndStatus,
  type Student,
} from "@/src/services/tasksApi";
import { auth } from "@/FirebaseConfig";
import CheckAuth from "@/src/components/CheckAuth";
import SafeAreaContainer from "@/src/components/SafeAreaContainer";
import ViewTitle from "@/src/components/ViewTitle";
import Loader from "@/src/components/Loader";
import Card from "@/src/components/ui/Card";
import Badge, { type BadgeTone } from "@/src/components/ui/Badge";
import TextField from "@/src/components/ui/TextField";
import Button from "@/src/components/ui/Button";
import { useTheme } from "@/src/theme/useTheme";
import { floatingTabBar } from "@/src/theme/layout";

function statusTone(task: Task): { label: string; tone: BadgeTone } {
  if (task.commited) return { label: "Zatwierdzone", tone: "success" };
  if (task.rate !== null) return { label: "Ocenione", tone: "warning" };
  return { label: "Do oceny", tone: "danger" };
}

export default function TeacherTask() {
  const router = useRouter();
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [ocena, setOcena] = useState("");
  const [komentarz, setKomentarz] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [student, setStudent] = useState<Student | null>(null);

  const formatDatePL = (date?: string) => {
    if (!date) return "-";
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setIsCheckingAuth(false);
        return;
      }
      try {
        const currentUser = await getCurrentUserData();
        setUserData(currentUser);
        if (currentUser?.role === "teacher" && id) loadTask(id);
      } catch (error) {
        console.log("Error loading user profile:", error);
      } finally {
        setIsCheckingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [id]);

  const loadTask = async (taskId: string) => {
    try {
      const found = await getTaskById(taskId);
      if (found) {
        setTask(found);
        setOcena(found.rate !== null ? found.rate.toString() : "");
        setKomentarz(found.comment);
        setStudent(await getStudentByUid(found.userId));
      }
    } catch {
      Alert.alert("Błąd", "Nie udało się załadować zadania.");
    } finally {
      setLoading(false);
    }
  };

  const validatedOcena = (): number | null | "invalid" => {
    if (!ocena) return null;
    const n = parseInt(ocena);
    if (isNaN(n) || n < 0 || n > 100) return "invalid";
    return n;
  };

  const handleSave = async () => {
    if (!task) return;
    const o = validatedOcena();
    if (o === "invalid") {
      Alert.alert("Błąd", "Ocena musi być liczbą z zakresu 0-100");
      return;
    }
    setIsSaving(true);
    try {
      await updateTaskGradeAndStatus(task.id, o, komentarz, false);
      setTask((p) => (p ? { ...p, rate: o, comment: komentarz, commited: false } : null));
      Alert.alert("Sukces", "Ocena i komentarz zostały zapisane", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Błąd", "Nie udało się zapisać.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!task) return;
    const o = validatedOcena();
    if (o === "invalid" || o === null) {
      Alert.alert("Błąd", "Musisz wystawić ocenę w zakresie 0-100 przed zatwierdzeniem");
      return;
    }
    setIsSaving(true);
    try {
      await updateTaskGradeAndStatus(task.id, o, komentarz, true);
      setTask((p) => (p ? { ...p, rate: o, comment: komentarz, commited: true } : null));
      Alert.alert("Sukces", "Zadanie zostało zatwierdzone", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Błąd", "Nie udało się zatwierdzić zadania.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isCheckingAuth) return <CheckAuth />;

  if (!userData || userData.role !== "teacher") {
    return (
      <SafeAreaContainer>
        <ViewTitle back>Szczegóły zadania</ViewTitle>
        <View style={styles.centered}>
          <Text style={{ color: t.colors.danger, fontSize: 20, fontWeight: "700" }}>
            Brak dostępu
          </Text>
          <Button
            title="Powrót"
            onPress={() => router.back()}
            style={{ marginTop: 16 }}
            fullWidth={false}
          />
        </View>
      </SafeAreaContainer>
    );
  }

  if (loading) {
    return (
      <SafeAreaContainer>
        <ViewTitle back>Szczegóły zadania</ViewTitle>
        <Loader />
      </SafeAreaContainer>
    );
  }

  if (!task) {
    return (
      <SafeAreaContainer>
        <ViewTitle back>Szczegóły zadania</ViewTitle>
        <View style={styles.centered}>
          <Text style={{ color: t.colors.danger, fontSize: 18, fontWeight: "700" }}>
            Nie znaleziono zadania
          </Text>
          <Button
            title="Powrót"
            onPress={() => router.back()}
            style={{ marginTop: 16 }}
            fullWidth={false}
          />
        </View>
      </SafeAreaContainer>
    );
  }

  const status = statusTone(task);

  return (
    <SafeAreaContainer>
      <ViewTitle back>Szczegóły zadania</ViewTitle>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Badge label={status.label} tone={status.tone} style={{ marginBottom: 14 }} />

          <Card style={{ marginBottom: 16 }}>
            <Text
              style={{
                color: t.colors.textPrimary,
                fontSize: 22,
                fontWeight: "800",
                marginBottom: 10,
              }}
            >
              {task.title}
            </Text>
            <Text style={{ color: t.colors.textSecondary, marginTop: 2 }}>
              Uczeń:{" "}
              {student ? `${student.firstName} ${student.surname}`.trim() : "(nieznany)"}
            </Text>
            <Text style={{ color: t.colors.textMuted, fontSize: 12, marginTop: 2 }}>
              ID: {task.userId}
            </Text>
            <Text style={{ color: t.colors.textSecondary, marginTop: 4 }}>
              Data: {formatDatePL(task.date)}
            </Text>
          </Card>

          <Section title="Treść zadania" t={t}>
            <Card>
              <Text style={{ color: t.colors.textPrimary, fontSize: 15, lineHeight: 22 }}>
                {task.taskContent}
              </Text>
            </Card>
          </Section>

          <Section title="Odpowiedź ucznia" t={t}>
            <Card style={{ backgroundColor: t.colors.surfaceAlt }}>
              <Text style={{ color: t.colors.textPrimary, fontSize: 15, lineHeight: 22 }}>
                {task.answerContent || "(Brak odpowiedzi)"}
              </Text>
            </Card>
          </Section>

          <Card
            style={{
              borderColor: t.colors.primary,
              borderWidth: 1.5,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                color: t.colors.primary,
                fontSize: 18,
                fontWeight: "700",
                marginBottom: 14,
              }}
            >
              Ocenianie
            </Text>

            <View style={{ gap: 14 }}>
              <TextField
                label="Ocena (0-100)"
                value={ocena}
                onChangeText={setOcena}
                placeholder="Wpisz ocenę"
                keyboardType="numeric"
                editable={!task.commited}
              />
              <TextField
                label="Komentarz"
                value={komentarz}
                onChangeText={setKomentarz}
                placeholder="Dodaj komentarz do pracy ucznia..."
                multiline
                editable={!task.commited}
              />
            </View>

            {!task.commited ? (
              <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
                <Button
                  title={isSaving ? "Zapisywanie..." : "Zapisz"}
                  variant="secondary"
                  fullWidth={false}
                  onPress={handleSave}
                  disabled={isSaving}
                  style={{ flex: 1 }}
                />
                <Button
                  title={isSaving ? "Zatwierdzanie..." : "Zatwierdź"}
                  fullWidth={false}
                  onPress={handleApprove}
                  disabled={isSaving}
                  style={{ flex: 1 }}
                />
              </View>
            ) : (
              <View
                style={[
                  styles.approvedInfo,
                  {
                    backgroundColor: t.colors.successSoft,
                    borderColor: t.colors.success,
                  },
                ]}
              >
                <Text
                  style={{
                    color: t.colors.success,
                    fontWeight: "700",
                    textAlign: "center",
                  }}
                >
                  Zatwierdzone
                </Text>
              </View>
            )}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaContainer>
  );
}

function Section({
  title,
  children,
  t,
}: {
  title: string;
  children: React.ReactNode;
  t: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          color: t.colors.textSecondary,
          marginLeft: 4,
          marginBottom: 8,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: floatingTabBar.contentBottomPadding },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  approvedInfo: {
    padding: 14,
    borderRadius: 12,
    marginTop: 14,
    borderWidth: 1,
  },
});
