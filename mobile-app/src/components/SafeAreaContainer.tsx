import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/useTheme";

export default function SafeAreaContainer({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) {
  const t = useTheme();
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[
        { flex: 1, paddingTop: 8, backgroundColor: t.colors.bg },
        style,
      ]}
    >
      {children}
    </SafeAreaView>
  );
}
