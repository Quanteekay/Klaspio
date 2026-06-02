import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Zadania",
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Pojedyncze zadanie",
        }}
      />
    </Stack>
  );
}
