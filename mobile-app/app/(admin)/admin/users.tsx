import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import {
  createNewUser,
  getAllUsers,
  sendUserPasswordReset,
  updateUserDataByUid,
} from "@/src/services/userApi";
import { getStudents, type Student } from "@/src/services/tasksApi";
import UserData from "@/src/models/UserData";
import { UserRole } from "@/src/models/UserRole";
import SafeAreaContainer from "@/src/components/SafeAreaContainer";
import ViewTitle from "@/src/components/ViewTitle";
import Card from "@/src/components/ui/Card";
import Badge, { type BadgeTone } from "@/src/components/ui/Badge";
import Button from "@/src/components/ui/Button";
import TextField from "@/src/components/ui/TextField";
import ThemedRefreshControl from "@/src/components/ui/ThemedRefreshControl";
import { useTheme } from "@/src/theme/useTheme";
import { useRefresh } from "@/src/hooks/useRefresh";
import { floatingTabBar } from "@/src/theme/layout";

const ROLE_TONE: Record<string, BadgeTone> = {
  admin: "danger",
  teacher: "warning",
  student: "success",
  parent: "primary",
};

const ROLE_LABEL_PL: Record<string, string> = {
  all: "Wszyscy",
  student: "Uczniowie",
  teacher: "Nauczyciele",
  admin: "Administratorzy",
  parent: "Rodzice",
};

const UserManagement = () => {
  const t = useTheme();
  const { role: roleParam } = useLocalSearchParams<{ role?: string }>();
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");

  // automatyczne ustawienie filtra z parametru routingu (statystyki na panelu)
  useEffect(() => {
    if (
      roleParam &&
      ["all", "student", "teacher", "admin", "parent"].includes(roleParam)
    ) {
      setRoleFilter(roleParam as UserRole | "all");
    }
  }, [roleParam]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const initialFormState: UserData & { password?: string } = {
    uid: "",
    firstName: "",
    surname: "",
    role: "student",
    email: "",
    active: true,
    password: "",
    children: [],
  };
  const [formData, setFormData] = useState(initialFormState);
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    fetchUsers();
    getStudents().then(setStudents).catch(() => setStudents([]));
  }, []);

  useEffect(() => {
    let result = users;
    if (searchText) {
      const q = searchText.toLowerCase();
      result = result.filter(
        (u) => u.surname.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }
    if (roleFilter !== "all") result = result.filter((u) => u.role === roleFilter);
    setFilteredUsers(result);
  }, [users, searchText, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error: any) {
      alert("Błąd pobierania: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const { refreshing, onRefresh } = useRefresh(fetchUsers);

  const openEditModal = (user: UserData) => {
    setIsEditing(true);
    setFormData({ ...user, password: "", children: user.children ?? [] });
    setModalVisible(true);
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData(initialFormState);
    setModalVisible(true);
  };

  const toggleChild = (uid: string) => {
    setFormData((prev) => {
      const current = prev.children ?? [];
      const next = current.includes(uid)
        ? current.filter((c) => c !== uid)
        : [...current, uid];
      return { ...prev, children: next };
    });
  };

  const handleSave = async () => {
    if (!formData.email || !formData.surname || !formData.firstName) {
      alert("Uzupełnij wymagane pola (Imię, Nazwisko, Email)");
      return;
    }
    try {
      if (isEditing) {
        await updateUserDataByUid(formData.uid, formData);
        alert("Zaktualizowano pomyślnie");
      } else {
        if (!formData.password || formData.password.length < 6) {
          alert("Hasło musi mieć min. 6 znaków");
          return;
        }
        await createNewUser(formData, formData.password);
        alert("Utworzono użytkownika");
      }
      setModalVisible(false);
      fetchUsers();
    } catch (error: any) {
      alert("Błąd: " + error.message);
    }
  };

  const handlePasswordReset = async () => {
    if (!formData.email) return;
    try {
      await sendUserPasswordReset(formData.email);
      alert(`Wysłano link resetujący na ${formData.email}`);
    } catch (error: any) {
      alert("Błąd wysyłania: " + error.message);
    }
  };

  const renderUserItem = ({ item }: { item: UserData }) => {
    const tone: BadgeTone = ROLE_TONE[item.role ?? "student"] ?? "neutral";
    return (
      <Pressable onPress={() => openEditModal(item)}>
        <Card style={{ marginBottom: 10 }}>
          <View style={styles.cardHeader}>
            <Text
              style={{ color: t.colors.textPrimary, fontSize: 17, fontWeight: "700" }}
            >
              {item.surname} {item.firstName}
            </Text>
            <Badge label={String(item.role ?? "—")} tone={tone} />
          </View>
          <Text style={{ color: t.colors.textSecondary, marginTop: 4 }}>
            {item.email}
          </Text>
          <Text
            style={{
              color: item.active ? t.colors.success : t.colors.danger,
              marginTop: 6,
              fontSize: 13,
              fontWeight: "600",
            }}
          >
            ● {item.active ? "Aktywne" : "Nieaktywne"}
          </Text>
        </Card>
      </Pressable>
    );
  };

  const roles = ["all", "student", "teacher", "admin", "parent"] as const;
  const formRoles = ["student", "teacher", "admin", "parent"] as const;

  return (
    <SafeAreaContainer>
      <ViewTitle back>Użytkownicy</ViewTitle>

      <View style={styles.toolbar}>
        <TextInput
          style={[
            styles.search,
            {
              backgroundColor: t.colors.surface,
              borderColor: t.colors.border,
              color: t.colors.textPrimary,
            },
          ]}
          placeholder="Szukaj (nazwisko lub email)..."
          placeholderTextColor={t.colors.textMuted}
          value={searchText}
          onChangeText={setSearchText}
        />
        <Button
          title="+ Dodaj"
          fullWidth={false}
          onPress={openAddModal}
          style={{ paddingHorizontal: 16, paddingVertical: 13 }}
        />
      </View>

      <View style={styles.chipsRow}>
        {roles.map((role) => {
          const active = roleFilter === role;
          return (
            <Pressable
              key={role}
              onPress={() => setRoleFilter(role)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 999,
                backgroundColor: active ? t.colors.primary : t.colors.surfaceAlt,
              }}
            >
              <Text
                style={{
                  color: active ? t.colors.onPrimary : t.colors.textSecondary,
                  fontWeight: "600",
                  fontSize: 13,
                }}
              >
                {ROLE_LABEL_PL[role] ?? role}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={t.colors.primary}
          style={{ marginTop: 20 }}
        />
      ) : (
        <FlatList
          refreshControl={
            <ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text
              style={{
                textAlign: "center",
                marginTop: 40,
                color: t.colors.textMuted,
                fontSize: 16,
              }}
            >
              Brak użytkowników.
            </Text>
          }
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalKeyboardWrap}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={[styles.modalOverlay, { backgroundColor: t.colors.overlay }]}>
            <View
              style={[
                styles.modalSheet,
                { backgroundColor: t.colors.bg },
              ]}
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  padding: 20,
                  paddingBottom: floatingTabBar.contentBottomPadding,
                }}
                keyboardShouldPersistTaps="handled"
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
                {isEditing ? "Edycja Użytkownika" : "Nowy Użytkownik"}
              </Text>

              <View style={{ gap: 14 }}>
                <TextField
                  label="Imię"
                  value={formData.firstName}
                  onChangeText={(v) => setFormData({ ...formData, firstName: v })}
                />
                <TextField
                  label="Nazwisko"
                  value={formData.surname}
                  onChangeText={(v) => setFormData({ ...formData, surname: v })}
                />
                <TextField
                  label="Email"
                  value={formData.email}
                  onChangeText={(v) => setFormData({ ...formData, email: v })}
                  editable={!isEditing}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                {!isEditing && (
                  <TextField
                    label="Hasło (min. 6 znaków)"
                    value={formData.password ?? ""}
                    onChangeText={(v) => setFormData({ ...formData, password: v })}
                    secureTextEntry
                  />
                )}

                {isEditing && (
                  <Pressable
                    onPress={handlePasswordReset}
                    style={[
                      styles.resetRow,
                      {
                        backgroundColor: t.colors.warningSoft,
                        borderColor: t.colors.warning,
                      },
                    ]}
                  >
                    <MaterialIcons
                      name="lock-reset"
                      size={22}
                      color={t.colors.warning}
                    />
                    <Text
                      style={{ color: t.colors.warning, fontWeight: "700", fontSize: 14 }}
                    >
                      Wyślij e-mail do resetu hasła
                    </Text>
                  </Pressable>
                )}

                <View>
                  <Text style={[styles.fieldLabel, { color: t.colors.textSecondary }]}>
                    Rola
                  </Text>
                  <View style={styles.rolesRow}>
                    {formRoles.map((r) => {
                      const active = formData.role === r;
                      return (
                        <Pressable
                          key={r}
                          onPress={() => setFormData({ ...formData, role: r })}
                          style={{
                            flex: 1,
                            paddingVertical: 12,
                            borderRadius: 12,
                            borderWidth: 1.5,
                            alignItems: "center",
                            backgroundColor: active
                              ? t.colors.primary
                              : t.colors.surface,
                            borderColor: active ? t.colors.primary : t.colors.border,
                          }}
                        >
                          <Text
                            style={{
                              color: active ? t.colors.onPrimary : t.colors.textSecondary,
                              fontWeight: "700",
                              fontSize: 13,
                            }}
                          >
                            {r}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {formData.role === "parent" && (
                  <View>
                    <Text style={[styles.fieldLabel, { color: t.colors.textSecondary }]}>
                      Dzieci (uczniowie)
                    </Text>
                    {students.length === 0 ? (
                      <Text style={{ color: t.colors.textMuted, fontSize: 14 }}>
                        Brak uczniów.
                      </Text>
                    ) : (
                      students.map((s) => {
                        const active = (formData.children ?? []).includes(s.uid);
                        return (
                          <Pressable
                            key={s.uid}
                            onPress={() => toggleChild(s.uid)}
                            style={[
                              styles.childRow,
                              {
                                backgroundColor: active
                                  ? t.colors.primarySoft
                                  : t.colors.surface,
                                borderColor: active ? t.colors.primary : t.colors.border,
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
                )}

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
                    style={{ color: t.colors.textPrimary, fontSize: 15, fontWeight: "700" }}
                  >
                    Konto Aktywne
                  </Text>
                  <Switch
                    value={formData.active}
                    onValueChange={(val) => setFormData({ ...formData, active: val })}
                    trackColor={{
                      false: t.colors.surfaceAlt,
                      true: t.colors.primarySoft,
                    }}
                    thumbColor={formData.active ? t.colors.primary : "#f4f3f4"}
                  />
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
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaContainer>
  );
};

export default UserManagement;

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 12,
  },
  search: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 10,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: floatingTabBar.contentBottomPadding,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  modalKeyboardWrap: { flex: 1 },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  rolesRow: { flexDirection: "row", gap: 8 },
  childRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 8,
    borderWidth: 1.5,
  },
  resetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
});
