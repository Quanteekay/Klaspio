import { ScrollView, StyleSheet } from "react-native";
import { floatingTabBar } from "@/src/theme/layout";

export default function NavigationContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ScrollView
      contentContainerStyle={styles.menuContainer}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  menuContainer: {
    gap: 10,
    paddingHorizontal: 15,
    paddingBottom: floatingTabBar.contentBottomPadding,
  },
});
