import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import SafeAreaContainer from "@/src/components/SafeAreaContainer";
import ViewTitle from "@/src/components/ViewTitle";
import LessonsCalendar from "@/src/components/Calendar/LessonsCalendar";
import { useChild } from "@/src/hooks/useChild";
import { useTheme } from "@/src/theme/useTheme";

export default function ParentCalendar() {
  const t = useTheme();
  const { childId } = useLocalSearchParams<{ childId?: string }>();
  const child = useChild(childId);

  return (
    <SafeAreaContainer>
      <ViewTitle back>Kalendarz</ViewTitle>
      {child && (
        <Text style={[styles.childName, { color: t.colors.primary }]}>
          {child.firstName} {child.surname}
        </Text>
      )}
      {!childId ? (
        <View style={styles.centered}>
          <Text style={{ color: t.colors.textSecondary, fontSize: 16 }}>
            Nie wybrano dziecka.
          </Text>
        </View>
      ) : (
        <LessonsCalendar studentId={childId} />
      )}
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  childName: {
    textAlign: "center",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
});
