import { Text, View, type ViewStyle } from "react-native";
import { useTheme } from "@/src/theme/useTheme";
import type { Theme } from "@/src/theme/theme";

export type BadgeTone =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  style?: ViewStyle;
}

function toneColors(t: Theme, tone: BadgeTone) {
  switch (tone) {
    case "success":
      return { bg: t.colors.successSoft, fg: t.colors.success };
    case "warning":
      return { bg: t.colors.warningSoft, fg: t.colors.warning };
    case "danger":
      return { bg: t.colors.dangerSoft, fg: t.colors.danger };
    case "info":
      return { bg: t.colors.infoSoft, fg: t.colors.info };
    case "neutral":
      return { bg: t.colors.surfaceAlt, fg: t.colors.textSecondary };
    default:
      return { bg: t.colors.primarySoft, fg: t.colors.primary };
  }
}

export default function Badge({ label, tone = "neutral", style }: BadgeProps) {
  const t = useTheme();
  const { bg, fg } = toneColors(t, tone);

  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderRadius: t.radii.pill,
          paddingHorizontal: 10,
          paddingVertical: 4,
          alignSelf: "flex-start",
        },
        style,
      ]}
    >
      <Text
        style={{
          color: fg,
          fontSize: 11,
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: 0.3,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
