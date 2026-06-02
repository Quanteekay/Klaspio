import {
  ActivityIndicator,
  Pressable,
  Text,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/theme/useTheme";
import type { Theme } from "@/src/theme/theme";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost"
  | "soft";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
  style?: ViewStyle;
}

function colorsFor(t: Theme, variant: ButtonVariant) {
  switch (variant) {
    case "secondary":
      return { bg: t.colors.surfaceAlt, fg: t.colors.textPrimary };
    case "danger":
      return { bg: t.colors.danger, fg: "#FFFFFF" };
    case "ghost":
      return { bg: "transparent", fg: t.colors.primary };
    case "soft":
      return { bg: t.colors.primarySoft, fg: t.colors.primary };
    default:
      return { bg: t.colors.primary, fg: t.colors.onPrimary };
  }
}

export default function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
  fullWidth = true,
  style,
}: ButtonProps) {
  const t = useTheme();
  const { bg, fg } = colorsFor(t, variant);
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderRadius: t.radii.md,
          paddingVertical: 15,
          paddingHorizontal: t.spacing.xl,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          width: fullWidth ? "100%" : undefined,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
          <Text style={{ color: fg, fontSize: 16, fontWeight: "700" }}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}
