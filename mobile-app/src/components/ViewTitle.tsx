import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/theme/useTheme";

export default function ViewTitle({
  children,
  back = false,
}: {
  children: React.ReactNode;
  back?: boolean;
}) {
  const router = useRouter();
  const t = useTheme();

  return (
    <View style={styles.container}>
      {back && (
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: t.colors.surfaceAlt }]}
          hitSlop={8}
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color={t.colors.textPrimary}
          />
        </TouchableOpacity>
      )}
      <Text
        style={[styles.heading, t.typography.h1, { color: t.colors.textPrimary }]}
        numberOfLines={1}
      >
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  heading: {
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
