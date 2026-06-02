import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Calendar, type DateData } from "react-native-calendars";
import { useFocusEffect, useRouter } from "expo-router";
import SafeAreaContainer from "@/src/components/SafeAreaContainer";
import ViewTitle from "@/src/components/ViewTitle";
import Loader from "@/src/components/Loader";
import Badge from "@/src/components/ui/Badge";
import Button from "@/src/components/ui/Button";
import Card from "@/src/components/ui/Card";
import EmptyState from "@/src/components/ui/EmptyState";
import TextField from "@/src/components/ui/TextField";
import ThemedRefreshControl from "@/src/components/ui/ThemedRefreshControl";
import type Lesson from "@/src/models/Lesson";
import type Subject from "@/src/models/Subject";
import type UserData from "@/src/models/UserData";
import {
  computeDurationMin,
  getAllLessons,
  unitsFromDuration,
  updateLesson,
} from "@/src/services/lessonsApi";
import { getAllSubjects } from "@/src/services/subjectsApi";
import { getAllUsers } from "@/src/services/userApi";
import { useRefresh } from "@/src/hooks/useRefresh";
import { floatingTabBar } from "@/src/theme/layout";
import { useTheme } from "@/src/theme/useTheme";

const UNIT_CHOICES = [1, 2, 3, 4];

const TIME_SLOTS: string[] = (() => {
  const out: string[] = [];
  for (let h = 7; h <= 21; h++) {
    for (const m of [0, 15, 30, 45]) {
      if (h === 21 && m > 0) break;
      out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return out;
})();

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Brak daty";
  return date.toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function lessonStatus(lesson: Lesson): "upcoming" | "past" {
  const time = new Date(lesson.date).getTime();
  if (Number.isNaN(time)) return "upcoming";
  return time < Date.now() ? "past" : "upcoming";
}

function localDay(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function localTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

export default function AdminLessons() {
  const t = useTheme();
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [editTopic, setEditTopic] = useState("");
  const [editDay, setEditDay] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editUnits, setEditUnits] = useState(1);
  const [editLocation, setEditLocation] = useState("");
  const [editOnline, setEditOnline] = useState(false);
  const [editMeetingUrl, setEditMeetingUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const [nextLessons, nextUsers, nextSubjects] = await Promise.all([
        getAllLessons(),
        getAllUsers(),
        getAllSubjects(),
      ]);
      setLessons(nextLessons);
      setUsers(nextUsers);
      setSubjects(nextSubjects);
    } catch {
      setError("Nie udało się pobrać zajęć.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [fetchData])
  );

  const { refreshing, onRefresh } = useRefresh(fetchData);

  const usersById = useMemo(() => {
    const map: Record<string, UserData> = {};
    users.forEach((user) => {
      map[user.uid] = user;
    });
    return map;
  }, [users]);

  const subjectsById = useMemo(() => {
    const map: Record<string, Subject> = {};
    subjects.forEach((subject) => {
      map[subject.id] = subject;
    });
    return map;
  }, [subjects]);

  const openEdit = (lesson: Lesson) => {
    if (lessonStatus(lesson) !== "upcoming") {
      Alert.alert("Edycja niedostępna", "Można edytować tylko nadchodzące zajęcia.");
      return;
    }
    setEditing(lesson);
    setEditTopic(lesson.topic ?? "");
    setEditDay(localDay(lesson.date));
    setEditTime(localTime(lesson.date));
    setEditUnits(unitsFromDuration(lesson.durationMin || 45));
    setEditLocation(lesson.location ?? "");
    setEditOnline(!!lesson.online);
    setEditMeetingUrl(lesson.meetingUrl ?? "");
  };

  const closeEdit = () => {
    if (saving) return;
    setEditing(null);
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    if (!editDay || !editTime) {
      Alert.alert("Uwaga", "Wybierz datę i godzinę zajęć.");
      return;
    }
    const nextDate = new Date(`${editDay}T${editTime}:00`);
    if (Number.isNaN(nextDate.getTime())) {
      Alert.alert("Uwaga", "Data lub godzina ma niepoprawny format.");
      return;
    }
    if (nextDate.getTime() < Date.now()) {
      Alert.alert("Uwaga", "Nie można przenieść zajęć na termin z przeszłości.");
      return;
    }

    setSaving(true);
    try {
      await updateLesson(editing.id, {
        topic: editTopic.trim(),
        date: nextDate.toISOString(),
        durationMin: computeDurationMin(editUnits),
        online: editOnline,
        location: editOnline ? "" : editLocation.trim(),
        meetingUrl: editOnline ? editMeetingUrl.trim() : "",
      });
      setEditing(null);
      await fetchData();
    } catch {
      Alert.alert("Błąd", "Nie udało się zaktualizować zajęć.");
    } finally {
      setSaving(false);
    }
  };

  const calendarTheme = {
    backgroundColor: t.colors.surface,
    calendarBackground: t.colors.surface,
    textSectionTitleColor: t.colors.textSecondary,
    dayTextColor: t.colors.textPrimary,
    monthTextColor: t.colors.textPrimary,
    textDisabledColor: t.colors.textMuted,
    todayTextColor: t.colors.primary,
    arrowColor: t.colors.primary,
    selectedDayBackgroundColor: t.colors.primary,
    selectedDayTextColor: t.colors.onPrimary,
    dotColor: t.colors.primary,
  };

  return (
    <SafeAreaContainer>
      <ViewTitle back>Kalendarz</ViewTitle>
      <View style={styles.content}>
        <Button
          title="Nowa lekcja"
          icon="add"
          onPress={() => router.push("/admin/schedule")}
          style={{ marginBottom: 12 }}
        />

        {error ? (
          <Text style={[styles.error, { color: t.colors.danger }]}>{error}</Text>
        ) : null}

        {loading ? (
          <Loader />
        ) : (
          <FlatList
            data={lessons}
            keyExtractor={(item) => item.id}
            refreshControl={
              <ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<EmptyState message="Brak zaplanowanych zajęć." />}
            renderItem={({ item }) => {
              const teacher = usersById[item.teacherId];
              const subject = subjectsById[item.subjectId];
              const status = lessonStatus(item);
              const studentCount = item.studentIds.length;
              const isUpcoming = status === "upcoming";
              return (
                <Card style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.title, { color: t.colors.textPrimary }]}>
                          {subject?.name || item.courseId || "Bez przedmiotu"}
                        </Text>
                        <Text style={[styles.subtitle, { color: t.colors.textSecondary }]}>
                          {item.topic || "Bez tematu"}
                        </Text>
                      </View>
                      <Badge
                        label={status === "upcoming" ? "Nadchodzące" : "Odbyte"}
                        tone={status === "upcoming" ? "primary" : "neutral"}
                      />
                    </View>

                    <View style={styles.metaGrid}>
                      <Meta label="Termin" value={formatDate(item.date)} />
                      <Meta
                        label="Nauczyciel"
                        value={
                          teacher
                            ? `${teacher.firstName} ${teacher.surname}`
                            : "Nieznany"
                        }
                      />
                      <Meta label="Uczniowie" value={`${studentCount}`} />
                      <Meta
                        label="Czas"
                        value={item.durationMin ? `${item.durationMin} min` : "Brak"}
                      />
                    </View>

                    <View style={styles.footer}>
                      <Badge
                        label={item.online ? "Online" : item.location || "Stacjonarne"}
                        tone={item.online ? "info" : "neutral"}
                      />
                      {item.groupId ? <Badge label="Grupa" tone="success" /> : null}
                    </View>

                    <View style={styles.actions}>
                      <Button
                        title="Szczegóły"
                        variant="secondary"
                        fullWidth={false}
                        onPress={() => router.push(`/lesson/${item.id}`)}
                        style={{ flex: 1 }}
                      />
                      {isUpcoming ? (
                        <Button
                          title="Edytuj"
                          fullWidth={false}
                          onPress={() => openEdit(item)}
                          style={{ flex: 1 }}
                        />
                      ) : null}
                    </View>
                  </Card>
              );
            }}
          />
        )}
      </View>

      <Modal
        visible={!!editing}
        transparent
        animationType="slide"
        onRequestClose={closeEdit}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: t.colors.overlay }]}
          onPress={closeEdit}
        >
          <Pressable
            style={[styles.modalSheet, { backgroundColor: t.colors.bg }, t.shadows.floating]}
            onPress={(event) => event.stopPropagation()}
          >
            <ScrollView
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.modalTitle, { color: t.colors.textPrimary }]}>
                Edycja zajęć
              </Text>
              <View style={{ gap: 14 }}>
                <TextField
                  label="Temat"
                  value={editTopic}
                  onChangeText={setEditTopic}
                  placeholder="Temat lekcji"
                />

                <View>
                  <Text style={[styles.label, { color: t.colors.textSecondary }]}>
                    Data
                  </Text>
                  <View
                    style={[
                      styles.calendarWrap,
                      {
                        backgroundColor: t.colors.surface,
                        borderColor: t.colors.border,
                      },
                    ]}
                  >
                    <Calendar
                      key={t.scheme}
                      onDayPress={(day: DateData) => setEditDay(day.dateString)}
                      markedDates={
                        editDay
                          ? {
                              [editDay]: {
                                selected: true,
                                selectedColor: t.colors.primary,
                              },
                            }
                          : {}
                      }
                      theme={calendarTheme}
                    />
                  </View>
                </View>

                <View>
                  <Text style={[styles.label, { color: t.colors.textSecondary }]}>
                    Godzina
                  </Text>
                  <View style={styles.timeGrid}>
                    {TIME_SLOTS.map((slot) => {
                      const active = slot === editTime;
                      return (
                        <Pressable
                          key={slot}
                          onPress={() => setEditTime(slot)}
                          style={[
                            styles.choice,
                            {
                              backgroundColor: active
                                ? t.colors.primary
                                : t.colors.surface,
                              borderColor: active ? t.colors.primary : t.colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              color: active ? t.colors.onPrimary : t.colors.textPrimary,
                              fontWeight: "700",
                            }}
                          >
                            {slot}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View>
                  <Text style={[styles.label, { color: t.colors.textSecondary }]}>
                    Czas trwania
                  </Text>
                  <View style={styles.timeGrid}>
                    {UNIT_CHOICES.map((units) => {
                      const active = units === editUnits;
                      return (
                        <Pressable
                          key={units}
                          onPress={() => setEditUnits(units)}
                          style={[
                            styles.choice,
                            {
                              backgroundColor: active
                                ? t.colors.primary
                                : t.colors.surface,
                              borderColor: active ? t.colors.primary : t.colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              color: active ? t.colors.onPrimary : t.colors.textPrimary,
                              fontWeight: "700",
                            }}
                          >
                            {computeDurationMin(units)} min
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View
                  style={[
                    styles.switchRow,
                    { backgroundColor: t.colors.surface, borderColor: t.colors.border },
                  ]}
                >
                  <Text style={{ color: t.colors.textPrimary, fontWeight: "700" }}>
                    Lekcja online
                  </Text>
                  <Switch value={editOnline} onValueChange={setEditOnline} />
                </View>

                {editOnline ? (
                  <TextField
                    label="Link do spotkania"
                    value={editMeetingUrl}
                    onChangeText={setEditMeetingUrl}
                    placeholder="https://..."
                    autoCapitalize="none"
                  />
                ) : (
                  <TextField
                    label="Sala / lokalizacja"
                    value={editLocation}
                    onChangeText={setEditLocation}
                    placeholder="Sala 2"
                  />
                )}

                <View style={styles.modalActions}>
                  <Button
                    title="Anuluj"
                    variant="secondary"
                    fullWidth={false}
                    onPress={closeEdit}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Zapisz"
                    fullWidth={false}
                    loading={saving}
                    onPress={handleSaveEdit}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaContainer>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  const t = useTheme();
  return (
    <View style={styles.metaItem}>
      <Text style={[styles.metaLabel, { color: t.colors.textMuted }]}>{label}</Text>
      <Text style={[styles.metaValue, { color: t.colors.textPrimary }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 16 },
  listContent: {
    paddingBottom: floatingTabBar.contentBottomPadding,
  },
  card: { marginBottom: 10 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  title: { fontSize: 17, fontWeight: "800" },
  subtitle: { fontSize: 14, marginTop: 4 },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  metaItem: {
    width: "47%",
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  metaValue: { fontSize: 14, fontWeight: "700" },
  footer: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 14,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  error: {
    textAlign: "center",
    fontWeight: "700",
    marginBottom: 10,
  },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalSheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: "90%",
  },
  modalContent: {
    padding: 20,
    paddingBottom: floatingTabBar.contentBottomPadding,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  calendarWrap: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    paddingBottom: 6,
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  choice: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  switchRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
});
