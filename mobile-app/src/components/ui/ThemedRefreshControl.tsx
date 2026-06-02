import { RefreshControl } from "react-native";
import { useTheme } from "@/src/theme/useTheme";

interface ThemedRefreshControlProps {
  refreshing: boolean;
  onRefresh: () => void;
}

/**
 * Pull-to-refresh wskaźnik z kolorami z motywu (iOS spring loader + Material).
 * Używaj jako `refreshControl={<ThemedRefreshControl ... />}` na ScrollView/FlatList/SectionList.
 */
export default function ThemedRefreshControl({
  refreshing,
  onRefresh,
}: ThemedRefreshControlProps) {
  const t = useTheme();
  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={t.colors.primary}
      colors={[t.colors.primary]}
      progressBackgroundColor={t.colors.surface}
    />
  );
}
