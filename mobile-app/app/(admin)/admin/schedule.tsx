import { useEffect, useMemo, useState } from "react";
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
import { useRouter } from "expo-router";
import SafeAreaContainer from "@/src/components/SafeAreaContainer";
import ViewTitle from "@/src/components/ViewTitle";
import Button from "@/src/components/ui/Button";
import TextField from "@/src/components/ui/TextField";
import { useTheme } from "@/src/theme/useTheme";
import { getStudents } from "@/src/services/tasksApi";
import { getAllUsers } from "@/src/services/userApi";
import { getAllGroups } from "@/src/services/groupsApi";
import { getAllSubjects } from "@/src/services/subjectsApi";
import { computeDurationMin, createLesson } from "@/src/services/lessonsApi";
import type Group from "@/src/models/Group";
import type Subject from "@/src/models/Subject";
import type UserData from "@/src/models/UserData";
import { floatingTabBar } from "@/src/theme/layout";

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

type PickerKind = "teacher" | "subject" | "group" | "student" | "units" | "time";

function unitsLabel(units: number): string {
  return `${units} godz. lekc. / ${computeDurationMin(units)} min`;
}

export default function AdminSchedule() {
  const t = useTheme();
  const router = useRouter();
  const [teachers, setTeachers] = useState<UserData[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<{ uid: string; firstName: string; surname: string }[]>([]);
  const [picker, setPicker] = useState<PickerKind | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [teacherId, setTeacherId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [topic, setTopic] = useState("");
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");
  const [units, setUnits] = useState(1);
  const [location, setLocation] = useState("");
  const [online, setOnline] = useState(false);
  const [meetingUrl, setMeetingUrl] = useState("");

  useEffect(() => {
    (async () => {
      const [allUsers, allSubjects, allGroups, allStudents] = await Promise.all([
        getAllUsers(),
        getAllSubjects(),
        getAllGroups(),
        getStudents(),
      ]);
      setTeachers(allUsers.filter((user) => user.role === "teacher" && user.active));
      setSubjects(allSubjects.filter((subject) => subject.active));
      setGroups(allGroups);
      setStudents(allStudents);
    })();
  }, []);

  const teacherName = useMemo(() => {
    const teacher = teachers.find((item) => item.uid === teacherId);
    return teacher ? `${teacher.firstName} ${teacher.surname}` : "Wybierz nauczyciela";
  }, [teacherId, teachers]);

  const subjectName = useMemo(() => {
    return subjects.find((item) => item.id === subjectId)?.name ?? "Wybierz przedmiot";
  }, [subjectId, subjects]);

  const groupName = useMemo(() => {
    return groups.find((item) => item.id === groupId)?.name ?? "Bez grupy";
  }, [groupId, groups]);

  const expandedStudentIds = useMemo(() => {
    if (!groupId) return studentIds;
    return groups.find((item) => item.id === groupId)?.memberIds ?? [];
  }, [groupId, groups, studentIds]);

  const handleSave = async () => {
    if (!teacherId) return Alert.alert("Uwaga", "Wybierz nauczyciela.");
    if (!subjectId) return Alert.alert("Uwaga", "Wybierz przedmiot.");
    if (!day) return Alert.alert("Uwaga", "Wybierz datę z kalendarza.");
    if (!time) return Alert.alert("Uwaga", "Wybierz godzinę z listy.");
    if (expandedStudentIds.length === 0) return Alert.alert("Uwaga", "Wybierz uczniów lub grupę.");

    const date = new Date(`${day}T${time}:00`);
    if (Number.isNaN(date.getTime())) {
      return Alert.alert("Uwaga", "Data lub godzina ma niepoprawny format.");
    }

    setSaving(true);
    try {
      await createLesson({
        courseId: subjectName,
        subjectId,
        groupId: groupId || undefined,
        teacherId,
        studentIds: expandedStudentIds,
        date: date.toISOString(),
        durationMin: computeDurationMin(units),
        topic: topic.trim(),
        summary: "",
        materials: [],
        location: online ? "" : location.trim(),
        online,
        meetingUrl: online ? meetingUrl.trim() : "",
      });
      Alert.alert("Sukces", "Lekcja została dodana do grafiku.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Błąd", "Nie udało się utworzyć lekcji.");
    } finally {
      setSaving(false);
    }
  };

  const toggleStudent = (uid: string) =>
    setStudentIds((prev) =>
      prev.includes(uid) ? prev.filter((item) => item !== uid) : [...prev, uid]
    );

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
      <ViewTitle back>Nowa lekcja</ViewTitle>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={{ gap: 14 }}>
          <PickerButton label="Przedmiot" value={subjectName} onPress={() => setPicker("subject")} t={t} />
          <TextField label="Temat" value={topic} onChangeText={setTopic} placeholder="np. Konwersacje" />
          <PickerButton label="Nauczyciel" value={teacherName} onPress={() => setPicker("teacher")} t={t} />
          <View style={styles.inline}>
            <View style={styles.inlineItem}>
              <PickerButton
                label="Data"
                value={day || "Wybierz datę"}
                onPress={() => setCalendarOpen(true)}
                t={t}
              />
            </View>
            <View style={styles.inlineItem}>
              <PickerButton
                label="Godzina"
                value={time || "Wybierz godzinę"}
                onPress={() => setPicker("time")}
                t={t}
              />
            </View>
          </View>
          <PickerButton label="Czas trwania" value={unitsLabel(units)} onPress={() => setPicker("units")} t={t} />
          <PickerButton label="Grupa" value={groupName} onPress={() => setPicker("group")} t={t} />
          {!groupId ? (
            <PickerButton
              label="Uczniowie"
              value={`${studentIds.length} wybranych`}
              onPress={() => setPicker("student")}
              t={t}
            />
          ) : (
            <Text style={{ color: t.colors.textMuted }}>
              Grupa zapisze jawnie {expandedStudentIds.length} uczniów w lekcji.
            </Text>
          )}
          <View style={[styles.switchRow, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
            <Text style={{ color: t.colors.textPrimary, fontWeight: "700" }}>Lekcja online</Text>
            <Switch value={online} onValueChange={setOnline} />
          </View>
          {online ? (
            <TextField label="Link do spotkania" value={meetingUrl} onChangeText={setMeetingUrl} placeholder="https://..." />
          ) : (
            <TextField label="Lokalizacja" value={location} onChangeText={setLocation} placeholder="Sala 2" />
          )}
          <Button title="Zapisz lekcję" onPress={handleSave} loading={saving} />
        </View>
      </ScrollView>
      <Modal visible={picker !== null} transparent animationType="slide" onRequestClose={() => setPicker(null)}>
        <Pressable style={[styles.modalOverlay, { backgroundColor: t.colors.overlay }]} onPress={() => setPicker(null)}>
          <Pressable style={[styles.modalSheet, { backgroundColor: t.colors.surface }, t.shadows.floating]} onPress={(event) => event.stopPropagation()}>
            <FlatList
              data={itemsForPicker(picker, teachers, subjects, groups, students, units)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.option, { borderBottomColor: t.colors.border }]}
                  onPress={() => {
                    if (picker === "teacher") setTeacherId(item.id);
                    if (picker === "subject") setSubjectId(item.id);
                    if (picker === "group") setGroupId(item.id === "none" ? "" : item.id);
                    if (picker === "units") setUnits(Number(item.id));
                    if (picker === "time") setTime(item.id);
                    if (picker === "student") toggleStudent(item.id);
                    if (picker !== "student") setPicker(null);
                  }}
                >
                  <Text style={{ color: t.colors.textPrimary, fontSize: 16, fontWeight: "600" }}>{item.label}</Text>
                </Pressable>
              )}
            />
            <Button title="Gotowe" variant="secondary" onPress={() => setPicker(null)} style={{ marginTop: 12 }} />
          </Pressable>
        </Pressable>
      </Modal>
      <Modal
        visible={calendarOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCalendarOpen(false)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: t.colors.overlay }]}
          onPress={() => setCalendarOpen(false)}
        >
          <Pressable
            style={[
              styles.modalSheet,
              { backgroundColor: t.colors.surface },
              t.shadows.floating,
            ]}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: t.colors.textPrimary }]}>
              Wybierz datę lekcji
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
                onDayPress={(selectedDay: DateData) => {
                  setDay(selectedDay.dateString);
                  setCalendarOpen(false);
                }}
                markedDates={
                  day
                    ? {
                        [day]: {
                          selected: true,
                          selectedColor: t.colors.primary,
                        },
                      }
                    : {}
                }
                theme={calendarTheme}
              />
            </View>
            <Button
              title="Zamknij"
              variant="secondary"
              onPress={() => setCalendarOpen(false)}
              style={{ marginTop: 12 }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaContainer>
  );
}

function PickerButton({ label, value, onPress, t }: { label: string; value: string; onPress: () => void; t: ReturnType<typeof useTheme> }) {
  return (
    <View>
      <Text style={[styles.label, { color: t.colors.textSecondary }]}>{label}</Text>
      <Pressable style={[styles.dropdown, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]} onPress={onPress}>
        <Text style={{ color: t.colors.textPrimary, fontSize: 16 }}>{value}</Text>
        <Text style={{ color: t.colors.textMuted }}>▼</Text>
      </Pressable>
    </View>
  );
}

function itemsForPicker(
  picker: PickerKind | null,
  teachers: UserData[],
  subjects: Subject[],
  groups: Group[],
  students: { uid: string; firstName: string; surname: string }[],
  units: number
) {
  if (picker === "teacher") return teachers.map((item) => ({ id: item.uid, label: `${item.firstName} ${item.surname}` }));
  if (picker === "subject") return subjects.map((item) => ({ id: item.id, label: item.name }));
  if (picker === "group") return [{ id: "none", label: "Bez grupy" }, ...groups.map((item) => ({ id: item.id, label: `${item.name} (${item.memberIds.length})` }))];
  if (picker === "student") return students.map((item) => ({ id: item.uid, label: `${item.firstName} ${item.surname}` }));
  if (picker === "units") return UNIT_CHOICES.map((item) => ({ id: String(item), label: item === units ? `${unitsLabel(item)} ✓` : unitsLabel(item) }));
  if (picker === "time") return TIME_SLOTS.map((item) => ({ id: item, label: item }));
  return [];
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: floatingTabBar.contentBottomPadding },
  inline: { flexDirection: "row", gap: 12 },
  inlineItem: { flex: 1 },
  label: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  dropdown: { borderWidth: 1.5, borderRadius: 12, padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  switchRow: { borderWidth: 1, borderRadius: 12, padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "70%", padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "800", marginBottom: 14, textAlign: "center" },
  calendarWrap: { borderRadius: 12, borderWidth: 1, overflow: "hidden", paddingBottom: 6 },
  option: { paddingVertical: 15, borderBottomWidth: 1 },
});
