import { Text, Pressable } from "react-native";
import { useTheme } from "@/src/theme/useTheme";

type FilterBadgeProps = {
  title: string;
  currentFilter: string | null;
  filter: string;
  setFilter: (filter: string) => void;
};

export default function FilterBadge({
  title,
  currentFilter,
  filter,
  setFilter,
}: FilterBadgeProps) {
  const t = useTheme();
  const active = currentFilter === filter;

  return (
    <Pressable
      style={{
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: t.radii.pill,
        backgroundColor: active ? t.colors.primary : t.colors.surfaceAlt,
      }}
      onPress={() => setFilter(filter)}
    >
      <Text
        style={{
          color: active ? t.colors.onPrimary : t.colors.textSecondary,
          fontWeight: "600",
          fontSize: 13,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
