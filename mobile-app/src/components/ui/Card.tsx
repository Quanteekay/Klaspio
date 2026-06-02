import { View, type ViewStyle } from "react-native";
import { useTheme } from "@/src/theme/useTheme";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  /** Mniejszy padding wewnętrzny. */
  compact?: boolean;
}

export default function Card({ children, style, compact = false }: CardProps) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: t.colors.surface,
          borderRadius: t.radii.lg,
          borderWidth: 1,
          borderColor: t.colors.border,
          padding: compact ? t.spacing.md : t.spacing.lg,
        },
        t.shadows.card,
        style as ViewStyle,
      ]}
    >
      {children}
    </View>
  );
}
