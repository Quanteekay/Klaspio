import SafeAreaContainer from "@/src/components/SafeAreaContainer";
import ViewTitle from "@/src/components/ViewTitle";
import NavigationItem, {
  NavigationItemType,
} from "@/src/components/Navigation/NavigationItem";
import NavigationContainer from "@/src/components/Navigation/NavigationMenu";

export default function Dashboard() {
  return (
    <SafeAreaContainer>
      <ViewTitle>Dashboard</ViewTitle>
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
    label: "Lista zadań",
    desc: "Przeglądaj zadania",
    iconName: "task",
    iconBackgroundColor: "#abcabc",
    route: "/teacher/tasks",
  },
  {
    label: "Kalendarz",
    desc: "Plan zajęć i tworzenie lekcji",
    iconName: "event",
    iconBackgroundColor: "#EC407A",
    route: "/teacher/calendar",
  },
  {
    label: "Materiały",
    desc: "Materiały i galeria szkoły",
    iconName: "perm-media",
    iconBackgroundColor: "#06B6D4",
    route: "/content" as unknown as NavigationItemType["route"],
  },
  {
    label: "Alerty",
    desc: "Powiadomienia o lekcjach i sprawach uczniów",
    iconName: "notifications",
    iconBackgroundColor: "#EF4444",
    route: "/notifications" as unknown as NavigationItemType["route"],
  },
  {
    label: "Profil",
    desc: "Dane konta, prywatność i wylogowanie",
    iconName: "person",
    iconBackgroundColor: "#64748B",
    route: "/teacher/profile",
  },
];
