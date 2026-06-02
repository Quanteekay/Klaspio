import { View, ActivityIndicator, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/useTheme";

export default function CheckAuth() {
  const t = useTheme();
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: t.colors.bg }}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 40,
        }}
      >
        <ActivityIndicator size="large" color={t.colors.primary} />
        <Text
          style={{
            fontSize: 15,
            color: t.colors.textSecondary,
            marginTop: 12,
          }}
        >
          Sprawdzanie uprawnień...
        </Text>
      </View>
    </SafeAreaView>
  );
}
