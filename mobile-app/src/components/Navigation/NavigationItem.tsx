import { View, Text, Pressable, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { type Href, useRouter } from "expo-router";
import { useTheme } from "@/src/theme/useTheme";

export type NavigationItemType = {
  label: string;
  desc: string;
  iconName: string;
  iconBackgroundColor?: string;
  route: Href;
};

type NavigationItemProps = NavigationItemType;

export default function NavigationItem({
  label,
  desc,
  iconName,
  iconBackgroundColor,
  route,
}: NavigationItemProps) {
  const router = useRouter();
  const t = useTheme();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        t.shadows.card,
        {
          backgroundColor: t.colors.surface,
          borderColor: t.colors.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
      onPress={() => router.push(route)}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: iconBackgroundColor || t.colors.primary },
        ]}
      >
        <MaterialIcons
          name={iconName as keyof typeof MaterialIcons.glyphMap}
          size={26}
          color="#FFFFFF"
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.buttonTitle, { color: t.colors.textPrimary }]}>
          {label}
        </Text>
        <Text style={[styles.buttonDesc, { color: t.colors.textSecondary }]}>
          {desc}
        </Text>
      </View>
      <MaterialIcons
        name="chevron-right"
        size={24}
        color={t.colors.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 3,
  },
  buttonDesc: {
    fontSize: 12.5,
  },
});
