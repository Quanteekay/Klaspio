import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import SafeAreaContainer from "@/src/components/SafeAreaContainer";
import ViewTitle from "@/src/components/ViewTitle";
import Card from "@/src/components/ui/Card";
import Badge from "@/src/components/ui/Badge";
import Button from "@/src/components/ui/Button";
import EmptyState from "@/src/components/ui/EmptyState";
import TextField from "@/src/components/ui/TextField";
import ThemedRefreshControl from "@/src/components/ui/ThemedRefreshControl";
import Loader from "@/src/components/Loader";
import { auth } from "@/FirebaseConfig";
import {
  createContentItem,
  deleteContentItem,
  getAllContent,
  updateContentItem,
} from "@/src/services/contentApi";
import type ContentItem from "@/src/models/ContentItem";
import { useRefresh } from "@/src/hooks/useRefresh";
import { useTheme } from "@/src/theme/useTheme";
import { floatingTabBar } from "@/src/theme/layout";

type Kind = ContentItem["kind"];
type FileType = ContentItem["fileType"];

export default function AdminContent() {
  const t = useTheme();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [kind, setKind] = useState<Kind>("material");
  const [fileType, setFileType] = useState<FileType>("link");
  const [active, setActive] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await getAllContent());
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

  const resetForm = () => {
    setEditing(null);
    setTitle("");
    setDescription("");
    setUrl("");
    setKind("material");
    setFileType("link");
    setActive(true);
  };

  const openEdit = (item: ContentItem) => {
    setEditing(item);
    setTitle(item.title);
    setDescription(item.description ?? "");
    setUrl(item.url);
    setKind(item.kind);
    setFileType(item.fileType);
    setActive(item.active);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) return Alert.alert("Uwaga", "Podaj tytuł.");
    if (!url.trim()) return Alert.alert("Uwaga", "Podaj link do zasobu.");
    setSaving(true);
    try {
      const payload = {
        kind,
        title,
        description,
        url,
        fileType,
        visibleFor: ["student", "parent", "teacher", "admin"] as ContentItem["visibleFor"],
        active,
        createdBy: auth.currentUser?.uid ?? "",
      };
      if (editing) await updateContentItem(editing.id, payload);
      else await createContentItem(payload);
      setModalOpen(false);
      resetForm();
      await fetchItems();
    } catch {
      Alert.alert("Błąd", "Nie udało się zapisać treści.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (item: ContentItem) => {
    Alert.alert("Usuń treść", `Usunąć "${item.title}"?`, [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Usuń",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteContentItem(item.id);
            await fetchItems();
          } catch {
            Alert.alert("Błąd", "Nie udało się usunąć treści.");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaContainer>
      <ViewTitle back>Materiały i galeria</ViewTitle>
      <View style={styles.content}>
        <Button
          title="Dodaj treść"
          icon="add"
          onPress={() => {
            resetForm();
            setModalOpen(true);
          }}
          style={{ marginBottom: 12 }}
        />
        {loading ? (
          <Loader />
        ) : (
          <FlatList
            data={items}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<EmptyState message="Brak treści." />}
            renderItem={({ item }) => (
              <Card style={{ marginBottom: 10 }}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.title, { color: t.colors.textPrimary }]}>
                      {item.title}
                    </Text>
                    <Text style={{ color: t.colors.textSecondary, marginTop: 4 }}>
                      {item.url}
                    </Text>
                  </View>
                  <Badge label={item.active ? "Aktywne" : "Ukryte"} tone={item.active ? "success" : "neutral"} />
                </View>
                <View style={styles.actions}>
                  <Button title="Edytuj" variant="secondary" fullWidth={false} onPress={() => openEdit(item)} />
                  <Button title="Usuń" variant="danger" fullWidth={false} onPress={() => confirmDelete(item)} />
                </View>
              </Card>
            )}
          />
        )}
      </View>

      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <KeyboardAvoidingView
          style={styles.modalKeyboardWrap}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable style={[styles.modalOverlay, { backgroundColor: t.colors.overlay }]} onPress={() => setModalOpen(false)}>
            <Pressable style={[styles.modalSheet, { backgroundColor: t.colors.bg }, t.shadows.floating]} onPress={(event) => event.stopPropagation()}>
              <Text style={[styles.modalTitle, { color: t.colors.textPrimary }]}>
                {editing ? "Edytuj treść" : "Nowa treść"}
              </Text>
              <View style={{ gap: 12 }}>
                <TextField label="Tytuł" value={title} onChangeText={setTitle} placeholder="np. Materiały do lekcji 4" />
                <TextField label="Opis" value={description} onChangeText={setDescription} placeholder="Krótki opis" multiline />
                <TextField label="Link" value={url} onChangeText={setUrl} placeholder="https://..." autoCapitalize="none" />
                <Segmented
                  label="Typ"
                  values={["material", "gallery"]}
                  value={kind}
                  onChange={(next) => setKind(next as Kind)}
                />
                <Segmented
                  label="Format"
                  values={["link", "pdf", "video", "image"]}
                  value={fileType}
                  onChange={(next) => setFileType(next as FileType)}
                />
                <View style={[styles.switchRow, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
                  <Text style={{ color: t.colors.textPrimary, fontWeight: "700" }}>Aktywne</Text>
                  <Switch value={active} onValueChange={setActive} />
                </View>
                <View style={styles.actions}>
                  <Button title="Anuluj" variant="secondary" fullWidth={false} onPress={() => setModalOpen(false)} style={{ flex: 1 }} />
                  <Button title="Zapisz" fullWidth={false} loading={saving} onPress={handleSave} style={{ flex: 1 }} />
                </View>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaContainer>
  );
}

function Segmented({
  label,
  values,
  value,
  onChange,
}: {
  label: string;
  values: string[];
  value: string;
  onChange: (next: string) => void;
}) {
  const t = useTheme();
  return (
    <View>
      <Text style={[styles.label, { color: t.colors.textSecondary }]}>{label}</Text>
      <View style={styles.segmented}>
        {values.map((item) => {
          const active = item === value;
          return (
            <Pressable
              key={item}
              onPress={() => onChange(item)}
              style={[
                styles.segment,
                { backgroundColor: active ? t.colors.primary : t.colors.surfaceAlt },
              ]}
            >
              <Text style={{ color: active ? t.colors.onPrimary : t.colors.textSecondary, fontWeight: "700" }}>
                {item}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 16 },
  listContent: { paddingBottom: floatingTabBar.contentBottomPadding },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 17, fontWeight: "800" },
  actions: { flexDirection: "row", gap: 10, marginTop: 12 },
  modalKeyboardWrap: { flex: 1 },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, maxHeight: "90%" },
  modalTitle: { fontSize: 20, fontWeight: "800", marginBottom: 14 },
  label: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  segmented: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  segment: { borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12 },
  switchRow: { borderWidth: 1, borderRadius: 12, padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
