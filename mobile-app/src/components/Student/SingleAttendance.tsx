import { StyleSheet, Text, View } from "react-native";
import type { AttendanceStatus } from "@/src/models/Attendance";
import { useTheme } from "@/src/theme/useTheme";
import type { Theme } from "@/src/theme/theme";

interface SingleAttendanceProps {
  date: string;
  status: AttendanceStatus;
  note?: string;
}

function statusConfig(t: Theme, status: AttendanceStatus) {
  switch (status) {
    case "present":
      return { label: "Obecny", fg: t.colors.success, bg: t.colors.successSoft };
    case "late":
      return {
        label: "Spóźnienie",
        fg: t.colors.warning,
        bg: t.colors.warningSoft,
      };
    default:
      return { label: "Nieobecny", fg: t.colors.danger, bg: t.colors.dangerSoft };
  }
}

function formatDatePL(date: string): string {
  if (!date) return "Brak daty";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "Brak daty";
  return d.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function SingleAttendance({
  date,
  status,
  note,
}: SingleAttendanceProps) {
  const t = useTheme();
  const config = statusConfig(t, status);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: t.colors.surface, borderColor: t.colors.border },
      ]}
    >
      <View style={styles.row}>
        <Text style={[styles.date, { color: t.colors.textPrimary }]}>
          {formatDatePL(date)}
        </Text>
        <View style={[styles.badge, { backgroundColor: config.bg }]}>
          <Text style={[styles.badgeText, { color: config.fg }]}>
            {config.label}
          </Text>
        </View>
      </View>
      {note ? (
        <Text style={[styles.note, { color: t.colors.textSecondary }]}>
          {note}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  date: { fontSize: 15, fontWeight: "600" },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  note: { marginTop: 8, fontSize: 13, fontStyle: "italic" },
});
