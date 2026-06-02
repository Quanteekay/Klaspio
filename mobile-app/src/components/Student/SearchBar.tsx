import { TextInput } from "react-native";
import { useTheme } from "@/src/theme/useTheme";

export default function SearchBar({
  searchQuery,
  setSearchQuery,
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}) {
  const t = useTheme();
  return (
    <TextInput
      style={{
        height: 44,
        borderWidth: 1,
        borderRadius: t.radii.md,
        marginHorizontal: 16,
        marginTop: 12,
        paddingHorizontal: 16,
        backgroundColor: t.colors.surface,
        borderColor: t.colors.border,
        color: t.colors.textPrimary,
        fontSize: 15,
      }}
      placeholder="Szukaj..."
      placeholderTextColor={t.colors.textMuted}
      value={searchQuery}
      onChangeText={setSearchQuery}
    />
  );
}
