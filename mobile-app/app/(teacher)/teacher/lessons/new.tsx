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
import { useLocalSearchParams, useRouter } from "expo-router";
import SafeAreaContainer from "@/src/components/SafeAreaContainer";
import ViewTitle from "@/src/components/ViewTitle";
import Loader from "@/src/components/Loader";
import TextField from "@/src/components/ui/TextField";
import Button from "@/src/components/ui/Button";
import { useTheme } from "@/src/theme/useTheme";
import { auth } from "@/FirebaseConfig";
import { getStudents, type Student } from "@/src/services/tasksApi";
import {
  computeDurationMin,
  createLesson,
  getLessonById,
  getLessonsByTeacher,
  lessonsConflict,
  LESSON_BREAK_MIN,
  unitsFromDuration,
  updateLessonImplementation,
  updateLesson,
} from "@/src/services/lessonsApi";
import { floatingTabBar } from "@/src/theme/layout";

// Sloty co 15 min od 7:00 do 21:00 włącznie
const TIME_SLOTS: string[] = (() => {
  const out: string[] = [];
  for (let h = 7; h <= 21; h++) {
    for (const m of [0, 15, 30, 45]) {
      if (h === 21 && m > 0) break;
      out.push(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
      );
    }
  }
  return out;
})();

const UNIT_CHOICES = [1, 2, 3, 4];

function unitsLabel(n: number): string {
  let word: string;
  if (n === 1) word = "godz. lekcyjna";
  else if (n >= 2 && n <= 4) word = "godz. lekcyjne";
  else word = "godz. lekcyjnych";
  return `${n} ${word} • ${computeDurationMin(n)} min`;
}

export default function LessonForm() {
  const router = useRouter();
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const [topic, setTopic] = useState("");
  const [courseId, setCourseId] = useState("");
  const [location, setLocation] = useState("");
  const [units, setUnits] = useState(1);
  const [online, setOnline] = useState(false);
  const [meetingUrl, setMeetingUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [materialsText, setMaterialsText] = useState("");
  const [day, setDay] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const [students, setStudents] = useState<Student[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [saving, setSaving] = useState(false);

  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [unitsPickerOpen, setUnitsPickerOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [allStudents, lesson] = await Promise.all([
          getStudents(),
          isEdit && id ? getLessonById(id) : Promise.resolve(null),
        ]);
        setStudents(allStudents);

        if (isEdit && lesson) {
          setTopic(lesson.topic);
          setCourseId(lesson.courseId);
          setLocation(lesson.location);
          setOnline(!!lesson.online);
          setMeetingUrl(lesson.meetingUrl ?? "");
          setSummary(lesson.summary ?? "");
          setMaterialsText((lesson.materials ?? []).join("\n"));
          setSelectedStudents(lesson.studentIds);
          setUnits(unitsFromDuration(lesson.durationMin));
          const d = new Date(lesson.date);
          if (!Number.isNaN(d.getTime())) {
            setDay(d.toISOString().split("T")[0]);
            setTime(
              `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
            );
          }
        }
      } catch {
        Alert.alert("Błąd", "Nie udało się załadować danych formularza.");
      } finally {
        setLoadingInit(false);
      }
    })();
  }, [id, isEdit]);

  const toggleStudent = (uid: string) =>
    setSelectedStudents((prev) =>
      prev.includes(uid) ? prev.filter((s) => s !== uid) : [...prev, uid]
    );

  const durationMin = useMemo(() => computeDurationMin(units), [units]);

  const handleSave = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return Alert.alert("Błąd", "Brak zalogowanego nauczyciela.");
    if (!isEdit) {
      return Alert.alert(
        "Brak dostępu",
        "Lekcje tworzy administrator w grafiku."
      );
    }
    if (!topic.trim()) return Alert.alert("Uwaga", "Podaj temat lekcji.");

    setSaving(true);
    try {
      if (isEdit && id) {
        const lesson = await getLessonById(id);
        if (!lesson || lesson.teacherId !== uid) {
          setSaving(false);
          return Alert.alert("Brak dostępu", "Możesz edytować tylko swoje lekcje.");
        }
        if (new Date(lesson.date).getTime() > Date.now()) {
          setSaving(false);
          return Alert.alert(
            "Lekcja jeszcze się nie rozpoczęła",
            "Realizację można uzupełnić dopiero od godziny rozpoczęcia lekcji."
          );
        }
        await updateLessonImplementation(id, {
          topic,
          summary,
          materials: materialsText.split("\n"),
        });
        Alert.alert("Sukces", "Realizacja lekcji została zaktualizowana.");
        router.back();
        return;
      }

      if (!day) return Alert.alert("Uwaga", "Wybierz datę lekcji.");
      if (!time) return Alert.alert("Uwaga", "Wybierz godzinę rozpoczęcia.");
      if (selectedStudents.length === 0)
        return Alert.alert("Uwaga", "Wybierz co najmniej jednego ucznia.");

      const isoDate = new Date(`${day}T${time}:00`).toISOString();

      // Walidacja konfliktów u nauczyciela (z 15-min przerwą)
      const existing = await getLessonsByTeacher(uid);
      const conflict = existing.find(
        (l) =>
          (!isEdit || l.id !== id) &&
          lessonsConflict(l, { date: isoDate, durationMin })
      );
      if (conflict) {
        const cd = new Date(conflict.date);
        const hh = String(cd.getHours()).padStart(2, "0");
        const mm = String(cd.getMinutes()).padStart(2, "0");
        setSaving(false);
        return Alert.alert(
          "Konflikt terminów",
          `Masz już lekcję "${conflict.topic || "(bez tematu)"}" o ${hh}:${mm} ` +
            `(${conflict.durationMin} min). Wymagana min. ${LESSON_BREAK_MIN} min przerwy między lekcjami.`
        );
      }

      const payload = {
        courseId: courseId.trim(),
        subjectId: courseId.trim(),
        groupId: undefined,
        teacherId: uid,
        studentIds: selectedStudents,
        date: isoDate,
        durationMin,
        topic: topic.trim(),
        summary: summary.trim(),
        materials: materialsText.split("\n").map((item) => item.trim()).filter(Boolean),
        location: location.trim(),
        online,
        meetingUrl: online ? meetingUrl.trim() : "",
      };

      if (isEdit && id) {
        await updateLesson(id, payload);
        Alert.alert("Sukces", "Lekcja zaktualizowana.");
      } else {
        await createLesson(payload);
        Alert.alert("Sukces", "Lekcja została utworzona.");
      }
      router.back();
    } catch {
      Alert.alert(
        "Błąd",
        isEdit
          ? "Nie udało się zaktualizować lekcji."
          : "Nie udało się utworzyć lekcji."
      );
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

  if (loadingInit) {
    return (
      <SafeAreaContainer>
        <ViewTitle back>{isEdit ? "Edycja lekcji" : "Nowa lekcja"}</ViewTitle>
        <Loader />
      </SafeAreaContainer>
    );
  }

  return (
    <SafeAreaContainer>
      <ViewTitle back>{isEdit ? "Realizacja lekcji" : "Nowa lekcja"}</ViewTitle>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: 14 }}>
          <TextField
            label="Temat"
            value={topic}
            onChangeText={setTopic}
            placeholder="np. Czas przeszły Past Simple"
          />
          {isEdit && (
            <>
              <Text style={[styles.infoText, { color: t.colors.textMuted }]}>
                Termin, czas trwania, sala, tryb online, przedmiot i lista uczniów
                są ustawiane przez administratora.
              </Text>
              <TextField
                label="Podsumowanie realizacji"
                value={summary}
                onChangeText={setSummary}
                placeholder="Co zostało zrealizowane?"
                multiline
              />
              <TextField
                label="Materiały"
                value={materialsText}
                onChangeText={setMaterialsText}
                placeholder="Jeden link lub opis materiału w każdej linii"
                multiline
              />
            </>
          )}
          {!isEdit && (
            <>
              <TextField
                label="Przedmiot"
                value={courseId}
                onChangeText={setCourseId}
                placeholder="np. Angielski B1"
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
                    onDayPress={(d: DateData) => setDay(d.dateString)}
                    markedDates={
                      day
                        ? { [day]: { selected: true, selectedColor: t.colors.primary } }
                        : {}
                    }
                    theme={calendarTheme}
                  />
                </View>
              </View>

              <View>
                <Text style={[styles.label, { color: t.colors.textSecondary }]}>
                  Godzina rozpoczęcia (co 15 min)
                </Text>
                <Pressable
                  onPress={() => setTimePickerOpen(true)}
                  style={[
                    styles.selector,
                    {
                      backgroundColor: t.colors.surface,
                      borderColor: t.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: time ? t.colors.textPrimary : t.colors.textMuted,
                      fontSize: 16,
                      fontWeight: time ? "600" : "400",
                    }}
                  >
                    {time ?? "Wybierz godzinę"}
                  </Text>
                  <Text style={{ color: t.colors.textMuted, fontSize: 12 }}>▾</Text>
                </Pressable>
              </View>

              <View>
                <Text style={[styles.label, { color: t.colors.textSecondary }]}>
                  Czas trwania
                </Text>
                <Pressable
                  onPress={() => setUnitsPickerOpen(true)}
                  style={[
                    styles.selector,
                    {
                      backgroundColor: t.colors.surface,
                      borderColor: t.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: t.colors.textPrimary,
                      fontSize: 16,
                      fontWeight: "600",
                    }}
                  >
                    {unitsLabel(units)}
                  </Text>
                  <Text style={{ color: t.colors.textMuted, fontSize: 12 }}>▾</Text>
                </Pressable>
                {units > 1 && (
                  <Text
                    style={{
                      color: t.colors.textMuted,
                      fontSize: 12,
                      marginTop: 6,
                      marginLeft: 4,
                    }}
                  >
                    Pomiędzy lekcjami doliczane są przerwy {LESSON_BREAK_MIN} min.
                  </Text>
                )}
              </View>

              <TextField
                label="Lokalizacja"
                value={location}
                onChangeText={setLocation}
                placeholder="np. Sala 12"
                editable={!online}
              />

              <View
                style={[
                  styles.switchRow,
                  {
                    backgroundColor: t.colors.surface,
                    borderColor: t.colors.border,
                  },
                ]}
              >
                <Text style={[styles.switchLabel, { color: t.colors.textPrimary }]}>
                  Lekcja online
                </Text>
                <Switch
                  value={online}
                  onValueChange={setOnline}
                  trackColor={{
                    false: t.colors.surfaceAlt,
                    true: t.colors.primarySoft,
                  }}
                  thumbColor={online ? t.colors.primary : "#f4f3f4"}
                />
              </View>

              {online && (
                <TextField
                  label="Link do spotkania"
                  value={meetingUrl}
                  onChangeText={setMeetingUrl}
                  placeholder="https://..."
                  autoCapitalize="none"
                />
              )}

              <View>
                <Text style={[styles.label, { color: t.colors.textSecondary }]}>
                  Uczniowie
                </Text>
                {students.length === 0 ? (
                  <Text
                    style={{
                      color: t.colors.textMuted,
                      fontSize: 14,
                      marginTop: 4,
                    }}
                  >
                    Brak uczniów w systemie.
                  </Text>
                ) : (
                  students.map((s) => {
                    const active = selectedStudents.includes(s.uid);
                    return (
                      <Pressable
                        key={s.uid}
                        onPress={() => toggleStudent(s.uid)}
                        style={[
                          styles.studentRow,
                          {
                            backgroundColor: active
                              ? t.colors.primarySoft
                              : t.colors.surface,
                            borderColor: active
                              ? t.colors.primary
                              : t.colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: active ? t.colors.primary : t.colors.textPrimary,
                            fontWeight: active ? "700" : "500",
                            fontSize: 15,
                          }}
                        >
                          {s.firstName} {s.surname}
                        </Text>
                        {active && (
                          <Text
                            style={{
                              color: t.colors.primary,
                              fontSize: 18,
                              fontWeight: "800",
                            }}
                          >
                            ✓
                          </Text>
                        )}
                      </Pressable>
                    );
                  })
                )}
              </View>
            </>
          )}

          <Button
            title={isEdit ? "Zapisz realizację" : "Zapisz lekcję"}
            onPress={handleSave}
            loading={saving}
            style={{ marginTop: 14 }}
          />
        </View>
      </ScrollView>

      {/* Time picker modal */}
      <Modal
        visible={timePickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setTimePickerOpen(false)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: t.colors.overlay }]}
          onPress={() => setTimePickerOpen(false)}
        >
          <Pressable
            style={[
              styles.modalSheet,
              { backgroundColor: t.colors.bg },
              t.shadows.floating,
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: t.colors.textPrimary }]}>
              Godzina rozpoczęcia
            </Text>
            <FlatList
              data={TIME_SLOTS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const active = item === time;
                return (
                  <Pressable
                    onPress={() => {
                      setTime(item);
                      setTimePickerOpen(false);
                    }}
                    style={[
                      styles.optionRow,
                      { borderBottomColor: t.colors.border },
                      active && { backgroundColor: t.colors.primarySoft },
                    ]}
                  >
                    <Text
                      style={{
                        color: active ? t.colors.primary : t.colors.textPrimary,
                        fontSize: 16,
                        fontWeight: active ? "700" : "500",
                      }}
                    >
                      {item}
                    </Text>
                    {active && (
                      <Text
                        style={{
                          color: t.colors.primary,
                          fontSize: 18,
                          fontWeight: "800",
                        }}
                      >
                        ✓
                      </Text>
                    )}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Units picker modal */}
      <Modal
        visible={unitsPickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setUnitsPickerOpen(false)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: t.colors.overlay }]}
          onPress={() => setUnitsPickerOpen(false)}
        >
          <Pressable
            style={[
              styles.modalSheet,
              { backgroundColor: t.colors.bg },
              t.shadows.floating,
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: t.colors.textPrimary }]}>
              Liczba godzin lekcyjnych
            </Text>
            {UNIT_CHOICES.map((n) => {
              const active = n === units;
              return (
                <Pressable
                  key={n}
                  onPress={() => {
                    setUnits(n);
                    setUnitsPickerOpen(false);
                  }}
                  style={[
                    styles.optionRow,
                    { borderBottomColor: t.colors.border },
                    active && { backgroundColor: t.colors.primarySoft },
                  ]}
                >
                  <Text
                    style={{
                      color: active ? t.colors.primary : t.colors.textPrimary,
                      fontSize: 16,
                      fontWeight: active ? "700" : "500",
                    }}
                  >
                    {unitsLabel(n)}
                  </Text>
                  {active && (
                    <Text
                      style={{
                        color: t.colors.primary,
                        fontSize: 18,
                        fontWeight: "800",
                      }}
                    >
                      ✓
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: floatingTabBar.contentBottomPadding },
  label: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
  },
  calendarWrap: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    paddingBottom: 6,
  },
  selector: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  switchLabel: { fontSize: 15, fontWeight: "600" },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 8,
    borderWidth: 1.5,
  },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "70%",
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 14,
    textAlign: "center",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderRadius: 10,
  },
});
