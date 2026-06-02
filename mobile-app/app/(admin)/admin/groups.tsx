import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import SafeAreaContainer from "@/src/components/SafeAreaContainer";
import ViewTitle from "@/src/components/ViewTitle";
import Loader from "@/src/components/Loader";
import Card from "@/src/components/ui/Card";
import Badge from "@/src/components/ui/Badge";
import Button from "@/src/components/ui/Button";
import TextField from "@/src/components/ui/TextField";
import EmptyState from "@/src/components/ui/EmptyState";
import ThemedRefreshControl from "@/src/components/ui/ThemedRefreshControl";
import { useTheme } from "@/src/theme/useTheme";
import { useRefresh } from "@/src/hooks/useRefresh";
import { auth } from "@/FirebaseConfig";
import { getStudents, type Student } from "@/src/services/tasksApi";
import {
  createGroup,
  deleteGroup,
  getAllGroups,
  updateGroup,
} from "@/src/services/groupsApi";
import type Group from "@/src/models/Group";
import { floatingTabBar } from "@/src/theme/layout";

interface FormState {
  id?: string;
  name: string;
  description: string;
  memberIds: string[];
}
const EMPTY_FORM: FormState = { name: "", description: "", memberIds: [] };

export default function GroupsScreen() {
  const t = useTheme();
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const isEditing = !!form.id;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [g, s] = await Promise.all([getAllGroups(), getStudents()]);
      setGroups(g);
      setStudents(s);
    } catch {
      // ciche pominięcie — empty/refresh nadal działa
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll])
  );

  const { refreshing, onRefresh } = useRefresh(fetchAll);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setModalVisible(true);
  };

  const openEdit = (g: Group) => {
    setForm({
      id: g.id,
      name: g.name,
      description: g.description ?? "",
      memberIds: [...g.memberIds],
    });
    setModalVisible(true);
  };

  const toggleMember = (uid: string) => {
    setForm((prev) => ({
      ...prev,
      memberIds: prev.memberIds.includes(uid)
        ? prev.memberIds.filter((m) => m !== uid)
        : [...prev.memberIds, uid],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert("Uwaga", "Podaj nazwę grupy.");
      return;
    }
    setSaving(true);
    try {
      if (isEditing && form.id) {
        await updateGroup(form.id, {
          name: form.name.trim(),
          description: form.description.trim(),
          memberIds: form.memberIds,
        });
      } else {
        await createGroup({
          name: form.name.trim(),
          description: form.description.trim(),
          memberIds: form.memberIds,
          createdBy: auth.currentUser?.uid ?? "",
        });
      }
      setModalVisible(false);
      fetchAll();
    } catch (error: any) {
      Alert.alert("Błąd", error?.message || "Nie udało się zapisać grupy.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!form.id) return;
    Alert.alert(
      "Usuń grupę",
      `Czy na pewno usunąć grupę „${form.name}"? Operacja jest nieodwracalna.`,
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Usuń",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteGroup(form.id!);
              setModalVisible(false);
              fetchAll();
            } catch (error: any) {
              Alert.alert(
                "Błąd",
                error?.message || "Nie udało się usunąć grupy."
              );
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Group }) => (
    <Pressable onPress={() => openEdit(item)}>
      <Card style={{ marginBottom: 10 }}>
        <View style={styles.cardHeader}>
          <Text
            style={{
              flex: 1,
              color: t.colors.textPrimary,
              fontSize: 17,
              fontWeight: "700",
            }}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Badge label={`${item.memberIds.length} uczniów`} tone="primary" />
        </View>
        {item.description ? (
          <Text
            style={{ color: t.colors.textSecondary, marginTop: 6 }}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        ) : null}
      </Card>
    </Pressable>
  );

  return (
    <SafeAreaContainer>
      <ViewTitle back>Grupy uczniów</ViewTitle>

      <View style={styles.toolbar}>
        <Button
          title="+ Nowa grupa"
          fullWidth={false}
          onPress={openAdd}
          style={{ paddingHorizontal: 16 }}
        />
      </View>

      {loading ? (
        <Loader />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <ThemedRefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
          ListEmptyComponent={<EmptyState message="Brak grup." />}
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalKeyboardWrap}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View
            style={[styles.modalOverlay, { backgroundColor: t.colors.overlay }]}
          >
            <View style={[styles.modalSheet, { backgroundColor: t.colors.bg }]}>
              <ScrollView
                contentContainerStyle={{
                  padding: 20,
                  paddingBottom: floatingTabBar.contentBottomPadding,
                }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
              <Text
                style={{
                  color: t.colors.textPrimary,
                  fontSize: 22,
                  fontWeight: "800",
                  textAlign: "center",
                  marginBottom: 18,
                }}
              >
                {isEditing ? "Edycja grupy" : "Nowa grupa"}
              </Text>

              <View style={{ gap: 14 }}>
                <TextField
                  label="Nazwa"
                  value={form.name}
                  onChangeText={(v) =>
                    setForm((p) => ({ ...p, name: v }))
                  }
                  placeholder="np. Grupa B1 — wtorki 17:00"
                />
                <TextField
                  label="Opis (opcjonalnie)"
                  value={form.description}
                  onChangeText={(v) =>
                    setForm((p) => ({ ...p, description: v }))
                  }
                  placeholder="Krótka notatka"
                  multiline
                />

                <View>
                  <Text style={[styles.fieldLabel, { color: t.colors.textSecondary }]}>
                    Uczniowie ({form.memberIds.length})
                  </Text>
                  {students.length === 0 ? (
                    <Text style={{ color: t.colors.textMuted, fontSize: 14 }}>
                      Brak uczniów w systemie.
                    </Text>
                  ) : (
                    students.map((s) => {
                      const active = form.memberIds.includes(s.uid);
                      return (
                        <Pressable
                          key={s.uid}
                          onPress={() => toggleMember(s.uid)}
                          style={[
                            styles.studentRow,
                            {
                              backgroundColor: active
                                ? t.colors.primarySoft
                                : t.colors.surface,
                              borderColor: active
                                ? t.colors.primary
                                : t.colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              color: active
                                ? t.colors.primary
                                : t.colors.textPrimary,
                              fontWeight: active ? "700" : "500",
                              fontSize: 15,
                            }}
                          >
                            {s.firstName} {s.surname}
                          </Text>
                          {active && (
                            <Text
                              style={{
                                color: t.colors.primary,
                                fontSize: 18,
                                fontWeight: "800",
                              }}
                            >
                              ✓
                            </Text>
                          )}
                        </Pressable>
                      );
                    })
                  )}
                </View>

                <View style={{ flexDirection: "row", gap: 12, marginTop: 14 }}>
                  <Button
                    title="Anuluj"
                    variant="secondary"
                    fullWidth={false}
                    onPress={() => setModalVisible(false)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Zapisz"
                    fullWidth={false}
                    onPress={handleSave}
                    loading={saving}
                    style={{ flex: 1 }}
                  />
                </View>

                {isEditing && (
                  <Button
                    title="Usuń grupę"
                    variant="danger"
                    onPress={handleDelete}
                    icon="trash"
                    style={{ marginTop: 6 }}
                  />
                )}
              </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    paddingHorizontal: 20,
    marginBottom: 12,
    alignItems: "flex-start",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: floatingTabBar.contentBottomPadding,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 8,
    borderWidth: 1.5,
  },
  modalKeyboardWrap: { flex: 1 },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
  },
});
