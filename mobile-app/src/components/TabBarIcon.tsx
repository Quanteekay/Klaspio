import { FontAwesome } from "@expo/vector-icons";
import type { ColorValue } from "react-native";

type TabBarIconProps = {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: ColorValue;
};

export function TabBarIcon(props: TabBarIconProps) {
  return <FontAwesome size={26} style={{ marginBottom: -3 }} {...props} />;
}
