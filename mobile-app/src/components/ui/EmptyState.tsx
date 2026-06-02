import { Text } from "react-native";
import { useTheme } from "@/src/theme/useTheme";

interface EmptyStateProps {
  message: string;
}

/** Spójny komunikat pustej listy — używaj w `ListEmptyComponent`. */
export default function EmptyState({ message }: EmptyStateProps) {
  const t = useTheme();
  return (
    <Text
      style={{
        textAlign: "center",
        marginTop: 40,
        fontSize: 16,
        fontWeight: "500",
        color: t.colors.textMuted,
      }}
    >
      {message}
    </Text>
  );
}
