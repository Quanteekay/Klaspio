import { useState, useCallback } from "react";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Text,
} from "react-native";
import SafeAreaContainer from "@/src/components/SafeAreaContainer";
import ViewTitle from "@/src/components/ViewTitle";
import Loader from "@/src/components/Loader";
import Button from "@/src/components/ui/Button";
import Card from "@/src/components/ui/Card";
import { useTheme } from "@/src/theme/useTheme";
import { submitTaskAnswer, getSingleTaskById } from "@/src/services/studentApi";
import Task from "@/src/models/Task";
import { floatingTabBar } from "@/src/theme/layout";

export default function HomeworkDetailsPage() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<Task | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [answerText, setAnswerText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchTaskDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const fetched = await getSingleTaskById(id);
      if (fetched) {
        setTask(fetched);
        setAnswerText(fetched.answerContent || "");
      } else {
        setTask(null);
      }
    } catch {
      Alert.alert("Błąd", "Nie udało się pobrać szczegółów zadania.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTaskDetails();
    }, [id])
  );

  const handleSubmitAnswer = async () => {
    if (!task) return;
    if (!answerText.trim()) {
      Alert.alert("Uwaga", "Treść odpowiedzi nie może być pusta.");
      return;
    }
    setSubmitting(true);
    try {
      await submitTaskAnswer(task.id, answerText);
      Alert.alert("Sukces", "Odpowiedź została wysłana.");
      setModalVisible(false);
      fetchTaskDetails();
    } catch {
      Alert.alert("Błąd", "Wystąpił błąd podczas wysyłania odpowiedzi.");
    } finally {
      setSubmitting(false);
    }
  };

  const dateFormatted = task?.date
    ? new Date(task.date).toLocaleDateString("pl-PL")
    : "Brak daty";

  return (
    <SafeAreaContainer>
      <ViewTitle back>Szczegóły</ViewTitle>
      {loading && <Loader />}
      {!loading && !task && (
        <View style={styles.center}>
          <Text style={{ color: t.colors.textSecondary }}>
            Nie znaleziono zadania.
          </Text>
        </View>
      )}
      {!loading && task && (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { color: t.colors.textPrimary }]}>
            {task.title}
          </Text>

          <Card style={{ marginBottom: 20 }}>
            <View style={styles.row}>
              <Text style={[styles.label, { color: t.colors.textSecondary }]}>
                Nauczyciel:
              </Text>
              <Text style={{ color: t.colors.textPrimary }}>
                {task.teacherName}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: t.colors.textSecondary }]}>
                Data:
              </Text>
              <Text style={{ color: t.colors.textPrimary }}>
                {dateFormatted}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: t.colors.textSecondary }]}>
                Ocena:
              </Text>
              <View
                style={[
                  styles.rateBadge,
                  {
                    backgroundColor:
                      task.rate !== null ? t.colors.successSoft : t.colors.surfaceAlt,
                  },
                ]}
              >
                <Text
                  style={{
                    color:
                      task.rate !== null ? t.colors.success : t.colors.textMuted,
                    fontWeight: "700",
                    fontSize: 12,
                  }}
                >
                  {task.rate !== null ? `${task.rate}/100` : "Brak oceny"}
                </Text>
              </View>
            </View>
          </Card>

          <Section title="Treść zadania" t={t}>
            <Card>
              <Text style={[styles.textContent, { color: t.colors.textPrimary }]}>
                {task.taskContent}
              </Text>
            </Card>
          </Section>

          {task.comment ? (
            <Section title="Komentarz nauczyciela" t={t}>
              <Card
                style={{
                  backgroundColor: t.colors.infoSoft,
                  borderColor: t.colors.info,
                }}
              >
                <Text style={[styles.textContent, { color: t.colors.textPrimary }]}>
                  {task.comment}
                </Text>
              </Card>
            </Section>
          ) : null}

          <Section title="Twoja odpowiedź" t={t}>
            {task.answerContent ? (
              <Card style={{ backgroundColor: t.colors.surfaceAlt }}>
                <Text style={[styles.textContent, { color: t.colors.textPrimary }]}>
                  {task.answerContent}
                </Text>
              </Card>
            ) : (
              <Text
                style={{
                  color: t.colors.textMuted,
                  fontStyle: "italic",
                  marginLeft: 4,
                  marginBottom: 10,
                }}
              >
                Nie przesłano jeszcze odpowiedzi.
              </Text>
            )}

            {!task.commited && (
              <Button
                title={task.answerContent ? "Edytuj odpowiedź" : "Wyślij odpowiedź"}
                onPress={() => setModalVisible(true)}
                style={{ marginTop: 10 }}
              />
            )}
          </Section>
        </ScrollView>
      )}

      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[styles.modalOverlay, { backgroundColor: t.colors.overlay }]}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: t.colors.surface },
              t.shadows.floating,
            ]}
          >
            <Text style={[styles.modalHeader, { color: t.colors.textPrimary }]}>
              Odpowiedź na: {task?.title}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: t.colors.surfaceAlt,
                  borderColor: t.colors.border,
                  color: t.colors.textPrimary,
                },
              ]}
              multiline
              textAlignVertical="top"
              placeholder="Wpisz treść rozwiązania..."
              placeholderTextColor={t.colors.textMuted}
              value={answerText}
              onChangeText={setAnswerText}
            />
            <View style={styles.modalButtons}>
              <Button
                title="Anuluj"
                variant="secondary"
                fullWidth={false}
                onPress={() => setModalVisible(false)}
                disabled={submitting}
                style={{ flex: 1 }}
              />
              {submitting ? (
                <View style={[styles.submitting, { flex: 1 }]}>
                  <ActivityIndicator color={t.colors.primary} />
                </View>
              ) : (
                <Button
                  title="Zapisz"
                  fullWidth={false}
                  onPress={handleSubmitAnswer}
                  style={{ flex: 1 }}
                />
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    <View style={{ marginBottom: 18 }}>
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
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: {
    paddingHorizontal: 16,
    paddingBottom: floatingTabBar.contentBottomPadding,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: { flex: 1, fontWeight: "500" },
  rateBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  textContent: { fontSize: 15, lineHeight: 22 },
  modalOverlay: { flex: 1, justifyContent: "center", padding: 20 },
  modalContent: { borderRadius: 16, padding: 20 },
  modalHeader: { fontSize: 17, fontWeight: "700", marginBottom: 14 },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    height: 150,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: { flexDirection: "row", gap: 10 },
  submitting: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
  },
});
