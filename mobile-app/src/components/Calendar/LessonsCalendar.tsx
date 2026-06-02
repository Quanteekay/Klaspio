import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Calendar, type DateData } from "react-native-calendars";
import { useFocusEffect, useRouter } from "expo-router";
import Loader from "@/src/components/Loader";
import ThemedRefreshControl from "@/src/components/ui/ThemedRefreshControl";
import { getLessonsByStudent, toCalendarDay } from "@/src/services/lessonsApi";
import type Lesson from "@/src/models/Lesson";
import { useTheme } from "@/src/theme/useTheme";
import { useRefresh } from "@/src/hooks/useRefresh";

function formatTime(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

interface LessonsCalendarProps {
  studentId: string;
}

export default function LessonsCalendar({ studentId }: LessonsCalendarProps) {
  const t = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const fetchLessons = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getLessonsByStudent(studentId);
      setLessons(data);
    } catch {
      setError("Błąd podczas ładowania kalendarza.");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useFocusEffect(
    useCallback(() => {
      fetchLessons();
    }, [fetchLessons])
  );

  const { refreshing, onRefresh } = useRefresh(fetchLessons);

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

  const markedDates = useMemo(() => {
    const marks: Record<string, object> = {};
    for (const lesson of lessons) {
      const day = toCalendarDay(lesson.date);
      if (day) marks[day] = { marked: true, dotColor: t.colors.primary };
    }
    if (selectedDay) {
      marks[selectedDay] = {
        ...(marks[selectedDay] ?? {}),
        selected: true,
        selectedColor: t.colors.primary,
      };
    }
    return marks;
  }, [lessons, selectedDay, t.colors.primary]);

  const visibleLessons = useMemo(() => {
    if (selectedDay) {
      return lessons.filter((l) => toCalendarDay(l.date) === selectedDay);
    }
    const today = startOfToday();
    return lessons.filter((l) => {
      const time = l.date ? new Date(l.date).getTime() : 0;
      return time >= today;
    });
  }, [lessons, selectedDay]);

  if (loading) return <Loader />;

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: t.colors.danger, fontSize: 16, fontWeight: "600" }}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View
        style={[
          styles.calendarWrap,
          { backgroundColor: t.colors.surface, borderColor: t.colors.border },
        ]}
      >
        <Calendar
          key={t.scheme}
          markedDates={markedDates}
          theme={calendarTheme}
          onDayPress={(day: DateData) =>
            setSelectedDay((prev) =>
              prev === day.dateString ? null : day.dateString
            )
          }
        />
      </View>

      <Text style={[styles.listTitle, { color: t.colors.textPrimary }]}>
        {selectedDay ? `Lekcje: ${selectedDay}` : "Nadchodzące lekcje"}
      </Text>

      {visibleLessons.length === 0 ? (
        <Text style={[styles.emptyText, { color: t.colors.textMuted }]}>
          {selectedDay ? "Brak lekcji w tym dniu." : "Brak nadchodzących lekcji."}
        </Text>
      ) : (
        visibleLessons.map((lesson) => (
          <Pressable
            key={lesson.id}
            onPress={() => router.push(`/lesson/${lesson.id}`)}
            style={({ pressed }) => [
              styles.lessonCard,
              {
                backgroundColor: t.colors.surface,
                borderColor: t.colors.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={styles.lessonHeader}>
              <Text
                style={[styles.lessonTopic, { color: t.colors.textPrimary }]}
                numberOfLines={1}
              >
                {lesson.topic || "Lekcja"}
              </Text>
              <Text style={[styles.lessonTime, { color: t.colors.primary }]}>
                {formatTime(lesson.date)}
              </Text>
            </View>
            <Text style={[styles.lessonMeta, { color: t.colors.textSecondary }]}>
              {lesson.online
                ? "🟢 Online"
                : lesson.location || "Lokalizacja nieokreślona"}
              {lesson.durationMin ? ` • ${lesson.durationMin} min` : ""}
            </Text>
            {lesson.online && lesson.meetingUrl ? (
              <Text style={[styles.lessonUrl, { color: t.colors.info }]}>
                {lesson.meetingUrl}
              </Text>
            ) : null}
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 15 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  calendarWrap: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    paddingBottom: 6,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 18,
    marginBottom: 10,
  },
  emptyText: { textAlign: "center", fontSize: 15, marginTop: 20 },
  lessonCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  lessonHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lessonTopic: { flex: 1, marginRight: 10, fontSize: 16, fontWeight: "700" },
  lessonTime: { fontSize: 14, fontWeight: "700" },
  lessonMeta: { fontSize: 13, marginTop: 6 },
  lessonUrl: { fontSize: 12, marginTop: 4 },
});
