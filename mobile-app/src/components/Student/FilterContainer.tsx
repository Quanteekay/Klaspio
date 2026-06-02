import { View, StyleSheet } from "react-native";

export default function FilterContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return <View style={styles.filterContainer}>{children}</View>;
}

const styles = StyleSheet.create({
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
  },
});
