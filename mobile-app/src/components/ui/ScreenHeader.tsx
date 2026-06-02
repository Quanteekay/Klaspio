import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/theme/useTheme";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: React.ReactNode;
}

export default function ScreenHeader({
  title,
  subtitle,
  back = false,
  right,
}: ScreenHeaderProps) {
  const t = useTheme();
  const router = useRouter();

  return (
    <View style={styles.wrap}>
      {back && (
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: t.colors.surfaceAlt }]}
          hitSlop={8}
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color={t.colors.textPrimary}
          />
        </TouchableOpacity>
      )}
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={[t.typography.h1, { color: t.colors.textPrimary }]}>
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[
                t.typography.caption,
                { color: t.colors.textSecondary, marginTop: 2 },
              ]}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 16 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
});
