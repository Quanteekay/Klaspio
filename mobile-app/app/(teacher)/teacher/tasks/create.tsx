import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import UserData from "@/src/models/UserData";
import { auth } from "@/FirebaseConfig";
import { getCurrentUserData } from "@/src/services/userApi";
import { createTask, getStudents } from "@/src/services/tasksApi";
import { getAllGroups } from "@/src/services/groupsApi";
import { getAllSubjects } from "@/src/services/subjectsApi";
import CheckAuth from "@/src/components/CheckAuth";
import SafeAreaContainer from "@/src/components/SafeAreaContainer";
import ViewTitle from "@/src/components/ViewTitle";
import TextField from "@/src/components/ui/TextField";
import Button from "@/src/components/ui/Button";
import { useTheme } from "@/src/theme/useTheme";
import type Group from "@/src/models/Group";
import type Subject from "@/src/models/Subject";
import { floatingTabBar } from "@/src/theme/layout";

interface Student {
  uid: string;
  firstName: string;
  surname: string;
}

export default function TeacherTaskCreate() {
  const router = useRouter();
  const t = useTheme();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [title, setTitle] = useState("");
  const [taskContent, setTaskContent] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setIsCheckingAuth(false);
        return;
      }
      try {
        const currentUser = await getCurrentUserData();
        setUserData(currentUser);
        if (currentUser?.role === "teacher") {
          try {
            const [studentData, groupData, subjectData] = await Promise.all([
              getStudents(),
              getAllGroups(),
              getAllSubjects(),
            ]);
            setStudents(studentData);
            setGroups(groupData);
            setSubjects(subjectData.filter((subject) => subject.active));
          } finally {
            setLoadingStudents(false);
          }
        } else {
          setLoadingStudents(false);
        }
      } catch (error) {
        console.log("Error loading user profile:", error);
        setLoadingStudents(false);
      } finally {
        setIsCheckingAuth(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const selectedName = () => {
    const s = students.find((s) => s.uid === selectedStudent);
    return s ? `${s.firstName} ${s.surname}` : "Wybierz ucznia...";
  };

  const selectedSubjectName = () =>
    subjects.find((subject) => subject.id === selectedSubject)?.name ??
    "Wybierz przedmiot...";

  const selectedGroupName = () =>
    groups.find((group) => group.id === selectedGroup)?.name ??
    "Bez grupy";

  const handleCreate = async () => {
    if (!title.trim()) return Alert.alert("Błąd", "Podaj tytuł zadania");
    if (!taskContent.trim()) return Alert.alert("Błąd", "Podaj treść zadania");
    if (!selectedSubject) return Alert.alert("Błąd", "Wybierz przedmiot");
    if (!selectedStudent && !selectedGroup)
      return Alert.alert("Błąd", "Wybierz ucznia lub grupę");
    if (!auth.currentUser) return;

    const group = groups.find((item) => item.id === selectedGroup);
    const assignees = selectedGroup ? group?.memberIds ?? [] : [selectedStudent];
    if (assignees.length === 0) {
      return Alert.alert("Błąd", "Wybrana grupa nie ma uczniów.");
    }

    setIsSaving(true);
    try {
      await Promise.all(
        assignees.map((userId) =>
          createTask({
            title: title.trim(),
            taskContent: taskContent.trim(),
            userId,
            subjectId: selectedSubject,
            groupId: selectedGroup || undefined,
            teacherId: auth.currentUser!.uid,
          })
        )
      );
      Alert.alert("Sukces", "Zadanie zostało utworzone", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert("Błąd", "Nie udało się utworzyć zadania");
    } finally {
      setIsSaving(false);
    }
  };

  if (isCheckingAuth || loadingStudents) return <CheckAuth />;

  if (!userData || userData.role !== "teacher") {
    return (
      <SafeAreaContainer>
        <ViewTitle back>Nowe zadanie</ViewTitle>
        <View style={styles.centered}>
          <Text style={{ color: t.colors.danger, fontSize: 20, fontWeight: "700" }}>
            Brak dostępu
          </Text>
          <Text
            style={{
              color: t.colors.textSecondary,
              textAlign: "center",
              marginTop: 8,
            }}
          >
            Tylko nauczyciele mogą tworzyć zadania.
          </Text>
          <Button
            title="Powrót"
            onPress={() => router.back()}
            style={{ marginTop: 16 }}
            fullWidth={false}
          />
        </View>
      </SafeAreaContainer>
    );
  }

  return (
    <SafeAreaContainer>
      <ViewTitle back>Nowe zadanie</ViewTitle>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: 14 }}>
          <TextField
            label="Tytuł zadania *"
            value={title}
            onChangeText={setTitle}
            placeholder="Krótki tytuł"
          />

          <View>
            <Text style={[styles.label, { color: t.colors.textSecondary }]}>
              Przedmiot *
            </Text>
            <Pressable
              onPress={() => setShowSubjectPicker(true)}
              style={[
                styles.dropdown,
                {
                  backgroundColor: t.colors.surface,
                  borderColor: t.colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: selectedSubject
                    ? t.colors.textPrimary
                    : t.colors.textMuted,
                  fontSize: 16,
                }}
              >
                {selectedSubjectName()}
              </Text>
              <Text style={{ color: t.colors.textMuted, fontSize: 12 }}>▼</Text>
            </Pressable>
          </View>

          <View>
            <Text style={[styles.label, { color: t.colors.textSecondary }]}>
              Grupa
            </Text>
            <Pressable
              onPress={() => setShowGroupPicker(true)}
              style={[
                styles.dropdown,
                {
                  backgroundColor: t.colors.surface,
                  borderColor: t.colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: selectedGroup ? t.colors.textPrimary : t.colors.textMuted,
                  fontSize: 16,
                }}
              >
                {selectedGroupName()}
              </Text>
              <Text style={{ color: t.colors.textMuted, fontSize: 12 }}>▼</Text>
            </Pressable>
          </View>

          {!selectedGroup && (
            <View>
            <Text style={[styles.label, { color: t.colors.textSecondary }]}>
              Przypisz do ucznia *
            </Text>
            <Pressable
              onPress={() => setShowStudentPicker(true)}
              style={[
                styles.dropdown,
                {
                  backgroundColor: t.colors.surface,
                  borderColor: t.colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: selectedStudent ? t.colors.textPrimary : t.colors.textMuted,
                  fontSize: 16,
                }}
              >
                {selectedName()}
              </Text>
              <Text style={{ color: t.colors.textMuted, fontSize: 12 }}>▼</Text>
            </Pressable>
          </View>
          )}

          <TextField
            label="Treść zadania *"
            value={taskContent}
            onChangeText={setTaskContent}
            placeholder="Opisz zadanie..."
            multiline
          />

          <Button
            title={isSaving ? "Tworzenie..." : "Utwórz zadanie"}
            onPress={handleCreate}
            loading={isSaving}
            style={{ marginTop: 6 }}
          />
        </View>
      </ScrollView>

      <Modal
        visible={showStudentPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStudentPicker(false)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: t.colors.overlay }]}
          onPress={() => setShowStudentPicker(false)}
        >
          <Pressable
            style={[
              styles.modalSheet,
              { backgroundColor: t.colors.surface },
              t.shadows.floating,
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={[styles.modalHeader, { borderBottomColor: t.colors.border }]}
            >
              <Text style={{ color: t.colors.textPrimary, fontSize: 17, fontWeight: "700" }}>
                Wybierz ucznia
              </Text>
              <Pressable onPress={() => setShowStudentPicker(false)} hitSlop={8}>
                <Text style={{ color: t.colors.textMuted, fontSize: 22 }}>✕</Text>
              </Pressable>
            </View>
            <FlatList
              data={students}
              keyExtractor={(item) => item.uid}
              renderItem={({ item }) => {
                const active = selectedStudent === item.uid;
                return (
                  <Pressable
                    style={[
                      styles.studentItem,
                      { borderBottomColor: t.colors.border },
                      active && { backgroundColor: t.colors.primarySoft },
                    ]}
                    onPress={() => {
                      setSelectedStudent(item.uid);
                      setShowStudentPicker(false);
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        color: active ? t.colors.primary : t.colors.textPrimary,
                        fontWeight: active ? "700" : "500",
                      }}
                    >
                      {item.firstName} {item.surname}
                    </Text>
                    {active && (
                      <Text style={{ color: t.colors.primary, fontSize: 18, fontWeight: "800" }}>
                        ✓
                      </Text>
                    )}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <PickerModal
        visible={showSubjectPicker}
        title="Wybierz przedmiot"
        items={subjects.map((subject) => ({
          id: subject.id,
          label: subject.name,
        }))}
        activeId={selectedSubject}
        onClose={() => setShowSubjectPicker(false)}
        onSelect={(id) => {
          setSelectedSubject(id);
          setShowSubjectPicker(false);
        }}
        t={t}
      />

      <PickerModal
        visible={showGroupPicker}
        title="Wybierz grupę"
        items={[
          { id: "", label: "Bez grupy" },
          ...groups.map((group) => ({
            id: group.id,
            label: `${group.name} (${group.memberIds.length})`,
          })),
        ]}
        activeId={selectedGroup}
        onClose={() => setShowGroupPicker(false)}
        onSelect={(id) => {
          setSelectedGroup(id);
          setSelectedStudent("");
          setShowGroupPicker(false);
        }}
        t={t}
      />
    </SafeAreaContainer>
  );
}

function PickerModal({
  visible,
  title,
  items,
  activeId,
  onClose,
  onSelect,
  t,
}: {
  visible: boolean;
  title: string;
  items: { id: string; label: string }[];
  activeId: string;
  onClose: () => void;
  onSelect: (id: string) => void;
  t: ReturnType<typeof useTheme>;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={[styles.modalOverlay, { backgroundColor: t.colors.overlay }]}
        onPress={onClose}
      >
        <Pressable
          style={[
            styles.modalSheet,
            { backgroundColor: t.colors.surface },
            t.shadows.floating,
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.modalHeader, { borderBottomColor: t.colors.border }]}>
            <Text style={{ color: t.colors.textPrimary, fontSize: 17, fontWeight: "700" }}>
              {title}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={{ color: t.colors.textMuted, fontSize: 22 }}>✕</Text>
            </Pressable>
          </View>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id || "none"}
            renderItem={({ item }) => {
              const active = activeId === item.id;
              return (
                <Pressable
                  style={[
                    styles.studentItem,
                    { borderBottomColor: t.colors.border },
                    active && { backgroundColor: t.colors.primarySoft },
                  ]}
                  onPress={() => onSelect(item.id)}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: active ? t.colors.primary : t.colors.textPrimary,
                      fontWeight: active ? "700" : "500",
                    }}
                  >
                    {item.label}
                  </Text>
                  {active && (
                    <Text style={{ color: t.colors.primary, fontSize: 18, fontWeight: "800" }}>
                      ✓
                    </Text>
                  )}
                </Pressable>
              );
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: floatingTabBar.contentBottomPadding },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  dropdown: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  studentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
});
