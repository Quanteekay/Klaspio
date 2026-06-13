import { useFonts } from "expo-font";
import { useEffect, useMemo } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
  type Theme as NavTheme,
} from "@react-navigation/native";
import { useTheme } from "@/src/theme/useTheme";
import BottomAppMenu from "@/src/components/Navigation/BottomAppMenu";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../src/assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const t = useTheme();

  // Mapujemy nasz motyw na theme react-navigation, żeby wewnętrzne kontenery
  // nawigatora (m.in. obszar wokół floating tab bara) nie ciągnęły białego
  // / ciemnego defaultu — w przeciwnym razie pod pigułką pojawia się
  // dodatkowy pasek tła.
  const navTheme: NavTheme = useMemo(() => {
    const base = t.scheme === "dark" ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: t.colors.primary,
        background: t.colors.bg,
        // UWAGA: `card` celowo ustawione na bg (nie surface) — tym kolorem
        // nawigator maluje wewnętrzny wrapper bottom-tabs (obszar dookoła
        // floating tab bara). Z `surface` był tam biały pasek pod pigułką.
        card: t.colors.bg,
        text: t.colors.textPrimary,
        border: t.colors.border,
        notification: t.colors.danger,
      },
    };
  }, [t.scheme, t.colors]);

  return (
    <ThemeProvider value={navTheme}>
      <>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: t.colors.bg },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="(student)" />
          <Stack.Screen name="(teacher)" />
          <Stack.Screen name="(admin)" />
          <Stack.Screen name="(parent)" />
          <Stack.Screen name="(shared)" />
        </Stack>
        <BottomAppMenu />
      </>
    </ThemeProvider>
  );
}
