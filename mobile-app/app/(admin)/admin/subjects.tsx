import { useCallback, useEffect, useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import SafeAreaContainer from "@/src/components/SafeAreaContainer";
import ViewTitle from "@/src/components/ViewTitle";
import Loader from "@/src/components/Loader";
import Button from "@/src/components/ui/Button";
import Card from "@/src/components/ui/Card";
import TextField from "@/src/components/ui/TextField";
import EmptyState from "@/src/components/ui/EmptyState";
import ThemedRefreshControl from "@/src/components/ui/ThemedRefreshControl";
import Badge from "@/src/components/ui/Badge";
import { useRefresh } from "@/src/hooks/useRefresh";
import { useTheme } from "@/src/theme/useTheme";
import type Subject from "@/src/models/Subject";
import {
  createSubject,
  deleteSubject,
  getAllSubjects,
  updateSubject,
} from "@/src/services/subjectsApi";
import { floatingTabBar } from "@/src/theme/layout";

export default function Subjects() {
  const t = useTheme();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    try {
      setSubjects(await getAllSubjects());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSubjects();
    }, [fetchSubjects])
  );

  const { refreshing, onRefresh } = useRefresh(fetchSubjects);

  useEffect(() => {
    if (!modalOpen) {
      setEditing(null);
      setName("");
      setDescription("");
      setActive(true);
    }
  }, [modalOpen]);

  const openCreate = () => setModalOpen(true);

  const openEdit = (subject: Subject) => {
    setEditing(subject);
    setName(subject.name);
    setDescription(subject.description ?? "");
    setActive(subject.active);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert("Uwaga", "Podaj nazwę przedmiotu.");
    setSaving(true);
    try {
      if (editing) {
        await updateSubject(editing.id, {
          name,
          description,
          active,
        });
      } else {
        await createSubject({
          name,
          description,
          active,
        });
      }
      setModalOpen(false);
      await fetchSubjects();
    } catch {
      Alert.alert("Błąd", "Nie udało się zapisać przedmiotu.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (subject: Subject) => {
    Alert.alert(
      "Usuń przedmiot",
      `Czy na pewno usunąć przedmiot "${subject.name}"?`,
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Usuń",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSubject(subject.id);
              await fetchSubjects();
            } catch {
              Alert.alert("Błąd", "Nie udało się usunąć przedmiotu.");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaContainer>
      <ViewTitle back>Przedmioty</ViewTitle>
      <View style={styles.content}>
        <Button
          title="Dodaj przedmiot"
          icon="add"
          onPress={openCreate}
          style={{ marginBottom: 12 }}
        />

        {loading ? (
          <Loader />
        ) : (
          <FlatList
            data={subjects}
            refreshControl={
              <ThemedRefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
              />
            }
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <EmptyState message="Brak przedmiotów. Dodaj pierwszy przedmiot do grafiku." />
            }
            renderItem={({ item }) => (
              <Card style={{ marginBottom: 10 }}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                      <Text
                        style={[
                          styles.title,
                          { color: t.colors.textPrimary },
                        ]}
                      >
                        {item.name || "Bez nazwy"}
                      </Text>
                      <Badge
                        label={item.active ? "Aktywny" : "Ukryty"}
                        tone={item.active ? "success" : "neutral"}
                      />
                    </View>
                    {item.description ? (
                      <Text
                        style={[
                          styles.description,
                          { color: t.colors.textSecondary },
                        ]}
                      >
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.actions}>
                    <Pressable onPress={() => openEdit(item)} hitSlop={8}>
                      <Ionicons
                        name="pencil"
                        size={22}
                        color={t.colors.primary}
                      />
                    </Pressable>
                    <Pressable onPress={() => confirmDelete(item)} hitSlop={8}>
                      <Ionicons
                        name="trash"
                        size={22}
                        color={t.colors.danger}
                      />
                    </Pressable>
                  </View>
                </View>
              </Card>
            )}
          />
        )}
      </View>

      <Modal
        visible={modalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setModalOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalKeyboardWrap}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable
            style={[styles.modalOverlay, { backgroundColor: t.colors.overlay }]}
            onPress={() => setModalOpen(false)}
          >
            <Pressable
              style={[
                styles.modalSheet,
                { backgroundColor: t.colors.bg },
                t.shadows.floating,
              ]}
              onPress={(event) => event.stopPropagation()}
            >
              <Text style={[styles.modalTitle, { color: t.colors.textPrimary }]}>
                {editing ? "Edytuj przedmiot" : "Nowy przedmiot"}
              </Text>
              <View style={{ gap: 14 }}>
                <TextField
                  label="Nazwa"
                  value={name}
                  onChangeText={setName}
                  placeholder="np. Angielski B1"
                />
                <TextField
                  label="Opis"
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Opcjonalny opis"
                  multiline
                />
                <View
                  style={[
                    styles.switchRow,
                    {
                      backgroundColor: t.colors.surface,
                      borderColor: t.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: t.colors.textPrimary,
                      fontSize: 15,
                      fontWeight: "700",
                    }}
                  >
                    Aktywny przedmiot
                  </Text>
                  <Switch value={active} onValueChange={setActive} />
                </View>
                <View style={styles.modalActions}>
                  <Button
                    title="Anuluj"
                    variant="secondary"
                    fullWidth={false}
                    onPress={() => setModalOpen(false)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Zapisz"
                    fullWidth={false}
                    loading={saving}
                    onPress={handleSave}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 16 },
  listContent: { paddingBottom: floatingTabBar.contentBottomPadding },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 17, fontWeight: "800", flexShrink: 1 },
  description: { marginTop: 6, fontSize: 14, lineHeight: 20 },
  actions: { flexDirection: "row", gap: 14, alignItems: "center" },
  modalKeyboardWrap: { flex: 1 },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalSheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", marginBottom: 16 },
  switchRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 4 },
});
