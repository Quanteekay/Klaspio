import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import SafeAreaContainer from "@/src/components/SafeAreaContainer";
import ViewTitle from "@/src/components/ViewTitle";
import NavigationItem, {
  NavigationItemType,
} from "@/src/components/Navigation/NavigationItem";
import NavigationContainer from "@/src/components/Navigation/NavigationMenu";
import Card from "@/src/components/ui/Card";
import Badge from "@/src/components/ui/Badge";
import { getCurrentUserData } from "@/src/services/userApi";
import { getStudentProgressStats, type StudentProgressStats } from "@/src/services/progressApi";
import { formatAverage } from "@/src/services/gradesApi";
import { useTheme } from "@/src/theme/useTheme";

export default function Dashboard() {
  const t = useTheme();
  const [stats, setStats] = useState<StudentProgressStats | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const user = await getCurrentUserData();
          setStats(await getStudentProgressStats(user.uid));
        } catch {
          setStats(null);
        }
      })();
    }, [])
  );

  return (
    <SafeAreaContainer>
      <ViewTitle>Dashboard</ViewTitle>
      {stats && (
        <Card style={{ marginHorizontal: 15, marginBottom: 12 }}>
          <Text style={{ color: t.colors.textPrimary, fontSize: 16, fontWeight: "800", marginBottom: 10 }}>
            Postępy
          </Text>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <Badge label={`Średnia ${formatAverage(stats.overallAverage)}`} tone="primary" />
            <Badge label={`Frekwencja ${stats.attendedPercent}%`} tone="success" />
            <Badge label={`${stats.subjectCount} przedm.`} tone="info" />
          </View>
        </Card>
      )}
      <NavigationContainer>
        {navigationItems.map(
          ({ label, desc, iconName, iconBackgroundColor, route }) => (
            <NavigationItem
              key={label}
              label={label}
              desc={desc}
              iconName={iconName}
              iconBackgroundColor={iconBackgroundColor}
              route={route}
            />
          )
        )}
      </NavigationContainer>
    </SafeAreaContainer>
  );
}

const navigationItems: NavigationItemType[] = [
  {
    label: "Oceny",
    desc: "Przeglądaj swoje oceny",
    iconName: "grade",
    iconBackgroundColor: "#66BB6A",
    route: "/student/grades",
  },
  {
    label: "Zadania domowe",
    desc: "Sprawdzaj i oddawaj zadania",
    iconName: "book",
    iconBackgroundColor: "#29B6F6",
    route: "/student/homework",
  },
  {
    label: "Obecności",
    desc: "Monitoruj swoją frekwencję",
    iconName: "check-circle",
    iconBackgroundColor: "#AB47BC",
    route: "/student/presence",
  },
  {
    label: "Kalendarz",
    desc: "Sprawdź plan zajęć",
    iconName: "event",
    iconBackgroundColor: "#EC407A",
    route: "/student/calendar",
  },
  {
    label: "Materiały",
    desc: "PDF, linki, wideo i galeria",
    iconName: "perm-media",
    iconBackgroundColor: "#06B6D4",
    route: "/content" as unknown as NavigationItemType["route"],
  },
  {
    label: "Alerty",
    desc: "Oceny, frekwencja, zadania i zmiany lekcji",
    iconName: "notifications",
    iconBackgroundColor: "#EF4444",
    route: "/notifications" as unknown as NavigationItemType["route"],
  },
  {
    label: "Profil",
    desc: "Zarządzaj swoim profilem",
    iconName: "person",
    iconBackgroundColor: "#FFA726",
    route: "/student/profile",
  },
];
