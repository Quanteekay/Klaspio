import { useCallback, useState } from "react";
import { FlatList, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import SafeAreaContainer from "@/src/components/SafeAreaContainer";
import ViewTitle from "@/src/components/ViewTitle";
import Card from "@/src/components/ui/Card";
import Badge from "@/src/components/ui/Badge";
import EmptyState from "@/src/components/ui/EmptyState";
import ThemedRefreshControl from "@/src/components/ui/ThemedRefreshControl";
import Loader from "@/src/components/Loader";
import { getContentForRole } from "@/src/services/contentApi";
import { getCurrentUserData } from "@/src/services/userApi";
import { useRefresh } from "@/src/hooks/useRefresh";
import { useTheme } from "@/src/theme/useTheme";
import type ContentItem from "@/src/models/ContentItem";
import { floatingTabBar } from "@/src/theme/layout";

export default function ContentScreen() {
  const t = useTheme();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const user = await getCurrentUserData();
      setItems(await getContentForRole(user.role));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [fetchItems])
  );

  const { refreshing, onRefresh } = useRefresh(fetchItems);

  return (
    <SafeAreaContainer>
      <ViewTitle back>Materiały i galeria</ViewTitle>
      {loading ? (
        <Loader />
      ) : (
        <FlatList
          data={items}
          refreshControl={
            <ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          ListEmptyComponent={<EmptyState message="Brak materiałów do wyświetlenia." />}
          renderItem={({ item }) => (
            <Pressable onPress={() => Linking.openURL(item.url)}>
              <Card style={{ marginBottom: 10 }}>
                <View style={styles.row}>
                  <Text style={[styles.title, { color: t.colors.textPrimary }]}>
                    {item.title}
                  </Text>
                  <Badge
                    label={item.kind === "gallery" ? "Galeria" : item.fileType}
                    tone={item.kind === "gallery" ? "info" : "primary"}
                  />
                </View>
                {item.description ? (
                  <Text style={[styles.description, { color: t.colors.textSecondary }]}>
                    {item.description}
                  </Text>
                ) : null}
                <Text style={[styles.link, { color: t.colors.info }]} numberOfLines={1}>
                  {item.url}
                </Text>
              </Card>
            </Pressable>
          )}
        />
      )}
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: floatingTabBar.contentBottomPadding },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  title: { fontSize: 17, fontWeight: "800", flex: 1 },
  description: { fontSize: 14, marginTop: 8, lineHeight: 20 },
  link: { fontSize: 13, marginTop: 8, fontWeight: "600" },
});
