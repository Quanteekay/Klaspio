import { SafeAreaView } from "react-native-safe-area-context";
import { View, type ViewStyle } from "react-native";
import { useTheme } from "@/src/theme/useTheme";

interface ScreenProps {
  children: React.ReactNode;
  /** Dodaje poziomy padding do treści. */
  padded?: boolean;
  style?: ViewStyle;
}

export default function Screen({ children, padded = false, style }: ScreenProps) {
  const t = useTheme();
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[{ flex: 1, backgroundColor: t.colors.bg, paddingTop: 8 }, style]}
    >
      {padded ? (
        <View style={{ flex: 1, paddingHorizontal: t.spacing.lg }}>
          {children}
        </View>
      ) : (
        children
      )}
    </SafeAreaView>
  );
}
