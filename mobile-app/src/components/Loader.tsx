import { ActivityIndicator } from "react-native";
import { useTheme } from "@/src/theme/useTheme";

export default function Loader() {
  const t = useTheme();
  return (
    <ActivityIndicator
      size="large"
      color={t.colors.primary}
      style={{ justifyContent: "center", alignItems: "center", flex: 1 }}
    />
  );
}
