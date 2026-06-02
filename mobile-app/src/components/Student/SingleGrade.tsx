import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  LayoutAnimation,
} from "react-native";
import type { RatingSubject } from "@/src/services/studentApi";
import { useTheme } from "@/src/theme/useTheme";
import type { Theme } from "@/src/theme/theme";

function ratingColor(t: Theme, rate: number) {
  if (rate >= 90) return t.colors.success;
  if (rate >= 70) return t.colors.info;
  if (rate >= 50) return t.colors.warning;
  return t.colors.danger;
}

export default function SingleGrade({
  title,
  rate,
  comment,
  teacherName,
  commited,
  taskContent,
}: RatingSubject) {
  const t = useTheme();
  const [expanded, setExpanded] = useState(false);
  const pillColor = ratingColor(t, rate);

  return (
    <View
      style={[
        styles.container,
        t.shadows.card,
        { backgroundColor: t.colors.surface, borderColor: t.colors.border },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text
            style={[styles.title, { color: t.colors.textPrimary }]}
            numberOfLines={2}
          >
            {title}
          </Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: commited
                  ? t.colors.successSoft
                  : t.colors.warningSoft,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: commited ? t.colors.success : t.colors.warning },
              ]}
            >
              {commited ? "Ocenione" : "Oczekujące"}
            </Text>
          </View>
        </View>

        <View style={[styles.ratingPill, { backgroundColor: pillColor }]}>
          <Text style={styles.ratingValue}>{rate}</Text>
          <Text style={styles.ratingMax}>/100</Text>
        </View>
      </View>

      <Pressable
        style={styles.expandToggle}
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setExpanded(!expanded);
        }}
      >
        <Text style={[styles.expandText, { color: t.colors.textSecondary }]}>
          Szczegóły oceny
        </Text>
        <Text
          style={{
            fontSize: 10,
            marginLeft: 6,
            color: t.colors.textSecondary,
            transform: [{ rotate: expanded ? "180deg" : "0deg" }],
          }}
        >
          ▼
        </Text>
      </Pressable>

      {expanded && (
        <View
          style={[styles.expandBody, { borderTopColor: t.colors.border }]}
        >
          {taskContent ? (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: t.colors.textMuted }]}>
                Zadanie
              </Text>
              <Text style={[styles.contentParams, { color: t.colors.textSecondary }]}>
                {taskContent}
              </Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: t.colors.textMuted }]}>
              Nauczyciel
            </Text>
            <Text style={{ fontSize: 13, color: t.colors.textPrimary }}>
              {teacherName || "Nieznany nauczyciel"}
            </Text>
          </View>

          {comment ? (
            <View
              style={[styles.feedbackBox, { backgroundColor: t.colors.surfaceAlt }]}
            >
              <Text style={[styles.sectionLabel, { color: t.colors.textMuted }]}>
                Opinia
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontStyle: "italic",
                  marginTop: 2,
                  color: t.colors.textSecondary,
                }}
              >
                {comment}
              </Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 14, borderRadius: 16, borderWidth: 1 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  title: { fontSize: 16, fontWeight: "700" },
  statusBadge: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  statusText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  ratingPill: {
    flexDirection: "row",
    alignItems: "baseline",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  ratingValue: { color: "#fff", fontSize: 16, fontWeight: "800" },
  ratingMax: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 10,
    marginLeft: 2,
    fontWeight: "600",
  },
  expandToggle: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingVertical: 4,
  },
  expandText: { fontSize: 12, fontWeight: "600" },
  expandBody: { marginTop: 8, borderTopWidth: 1, paddingTop: 12 },
  section: { marginBottom: 8 },
  sectionLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    marginBottom: 3,
    fontWeight: "700",
  },
  contentParams: { fontSize: 13, lineHeight: 18 },
  feedbackBox: { marginTop: 10, padding: 10, borderRadius: 10 },
});
