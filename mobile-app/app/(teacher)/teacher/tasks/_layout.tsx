import { Stack } from "expo-router";

export default function TasksLayout() {
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
        name="create"
        options={{
          title: "Nowe zadanie",
        }}
      />
      <Stack.Screen
        name="task"
        options={{
          title: "Pojedyncze zadanie",
        }}
      />
    </Stack>
  );
}
