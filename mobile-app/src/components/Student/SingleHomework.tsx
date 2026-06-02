import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Task from "@/src/models/Task";
import { useTheme } from "@/src/theme/useTheme";

interface SingleHomeworkProps {
  task: Task;
  onPressAnswer: (task: Task) => void;
}

export default function SingleHomework({
  task,
  onPressAnswer,
}: SingleHomeworkProps) {
  const t = useTheme();
  const isSent = !!task.answerContent;
  const isCommited = !!task.commited;

  const dateFormatted = task.date
    ? new Date(task.date).toLocaleDateString("pl-PL")
    : "Brak daty";

  const status = isCommited
    ? { label: "Zatwierdzone", icon: "checkmark-done-circle", fg: t.colors.info, bg: t.colors.infoSoft }
    : isSent
    ? { label: "Wysłane", icon: "checkmark-circle", fg: t.colors.success, bg: t.colors.successSoft }
    : { label: "Do zrobienia", icon: "time", fg: t.colors.warning, bg: t.colors.warningSoft };

  return (
    <Pressable
      onPress={() => onPressAnswer(task)}
      style={({ pressed }) => [
        styles.container,
        t.shadows.card,
        {
          backgroundColor: t.colors.surface,
          borderColor: t.colors.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={styles.contentRow}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text
            style={[styles.title, { color: t.colors.textPrimary }]}
            numberOfLines={1}
          >
            {task.title}
          </Text>
          <Text style={[styles.subtitle, { color: t.colors.textSecondary }]}>
            {task.teacherName} • {dateFormatted}
          </Text>
        </View>

        <View style={styles.rightSide}>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Ionicons
              name={status.icon as keyof typeof Ionicons.glyphMap}
              size={13}
              color={status.fg}
            />
            <Text style={[styles.statusText, { color: status.fg }]}>
              {status.label}
            </Text>
          </View>

          <View
            style={[styles.rateContainer, { backgroundColor: t.colors.surfaceAlt }]}
          >
            <Text style={[styles.rateText, { color: t.colors.textPrimary }]}>
              {task.rate !== null ? task.rate : "-"}/100
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  contentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 12 },
  rightSide: { alignItems: "flex-end", gap: 6 },
  rateContainer: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    minWidth: 54,
    alignItems: "center",
  },
  rateText: { fontWeight: "700", fontSize: 12 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 4,
  },
  statusText: { fontSize: 10, fontWeight: "700" },
});
