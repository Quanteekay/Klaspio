import { useEffect } from "react";
import { StyleSheet, ScrollView, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
} from "react-native-reanimated";
import SafeAreaContainer from "@/src/components/SafeAreaContainer";
import { useTheme } from "@/src/theme/useTheme";
import { floatingTabBar } from "@/src/theme/layout";

const FeatureItem = ({
  icon,
  text,
  delay,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  delay: number;
}) => {
  const t = useTheme();
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      style={[
        styles.featureItem,
        { backgroundColor: t.colors.surface, borderColor: t.colors.border },
      ]}
    >
      <Ionicons
        name={icon}
        size={24}
        color={t.colors.primary}
        style={styles.featureIcon}
      />
      <Text style={[styles.featureText, { color: t.colors.textPrimary }]}>
        {text}
      </Text>
    </Animated.View>
  );
};

export default function GuestPage() {
  const t = useTheme();
  const scale = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withDelay(300, withSpring(1));
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <SafeAreaContainer>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Animated.View
              style={[
                styles.iconContainer,
                { backgroundColor: t.colors.primarySoft },
                animatedIconStyle,
              ]}
            >
              <Ionicons name="school" size={64} color={t.colors.primary} />
            </Animated.View>
            <Animated.Text
              entering={FadeInUp.duration(1000).springify()}
              style={[styles.title, { color: t.colors.textPrimary }]}
            >
              Klaspio
            </Animated.Text>
            <Animated.Text
              entering={FadeInUp.delay(200).duration(1000).springify()}
              style={[styles.subtitle, { color: t.colors.textSecondary }]}
            >
              Zarządzaj swoją edukacją w prosty sposób
            </Animated.Text>
          </View>

          <View style={styles.featuresContainer}>
            <FeatureItem
              icon="calendar-outline"
              text="Planuj zajęcia i zadania"
              delay={400}
            />
            <FeatureItem
              icon="book-outline"
              text="Dostęp do materiałów"
              delay={600}
            />
            <FeatureItem
              icon="chatbubbles-outline"
              text="Kontakt z nauczycielami"
              delay={800}
            />
            <FeatureItem
              icon="stats-chart-outline"
              text="Śledź swoje postępy"
              delay={1000}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, paddingBottom: floatingTabBar.contentBottomPadding },
  container: { flex: 1, padding: 20, justifyContent: "space-between" },
  header: { alignItems: "center", marginTop: 40 },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    marginBottom: 10,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 17, textAlign: "center", marginBottom: 20 },
  featuresContainer: { marginVertical: 20, gap: 12 },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  featureIcon: { marginRight: 15 },
  featureText: { fontSize: 16, fontWeight: "500" },
});
