import { Pressable, Text } from "react-native";
import { useTheme } from "@/src/theme/useTheme";

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export default function Chip({ label, active = false, onPress }: ChipProps) {
  const t = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: active ? t.colors.primary : t.colors.surfaceAlt,
        borderRadius: t.radii.pill,
        paddingVertical: 9,
        paddingHorizontal: 16,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text
        style={{
          color: active ? t.colors.onPrimary : t.colors.textSecondary,
          fontSize: 13,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
