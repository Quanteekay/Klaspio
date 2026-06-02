import { useState, useEffect } from "react";
import { router } from "expo-router";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut,
  updatePassword,
} from "firebase/auth";
import {
  getCurrentUserData,
  updateCurrentUserData,
  updateCurrentUserEmail,
} from "@/src/services/userApi";
import type UserData from "@/src/models/UserData";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  ScrollView,
  Text,
  View,
} from "react-native";
import ProfileInfo from "@/src/components/Profile/ProfileInfo";
import EditProfile from "@/src/components/Profile/EditProfile";
import ViewTitle from "@/src/components/ViewTitle";
import { auth } from "@/FirebaseConfig";
import SafeAreaContainer from "@/src/components/SafeAreaContainer";
import { Button, TextField } from "@/src/components/ui";
import { pickAndUploadAvatar } from "@/src/services/profileMediaApi";
import { registerPushToken } from "@/src/services/notificationsApi";
import { floatingTabBar } from "@/src/theme/layout";
import { useTheme } from "@/src/theme/useTheme";

const Profile = () => {
  const t = useTheme();
  const [userData, setUserData] = useState<UserData>({
    firstName: "Anonymous",
    surname: "Anonymous",
    role: "guest",
    email: "-",
    uid: "-",
    active: true,
  });

  const userRole = userData.role;
  const [isEditing, setIsEditing] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        return;
      }

      try {
        const currentUser = await getCurrentUserData();
        setUserData(currentUser);
      } catch (error) {
        console.log("Error loading user profile:", error);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async (updatedData: UserData) => {
    try {
      if (userRole === "guest") {
        setUserData(updatedData);
        setIsEditing(false);
        return;
      }

      if (!userData?.uid) return;

      const normalizedEmail = updatedData.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        Alert.alert("Uwaga", "Podaj poprawny adres e-mail.");
        return;
      }

      if (normalizedEmail !== userData.email.trim().toLowerCase()) {
        await updateCurrentUserEmail(normalizedEmail);
      }

      setUserData({
        ...userData,
        email: normalizedEmail,
      });
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      if (error?.code === "auth/email-already-in-use") {
        Alert.alert("Email zajęty", "Ten adres e-mail jest już używany przez innego użytkownika.");
      } else if (error?.code === "auth/requires-recent-login") {
        Alert.alert(
          "Wymagane ponowne logowanie",
          "Ze względów bezpieczeństwa zaloguj się ponownie i spróbuj zmienić email jeszcze raz."
        );
      } else if (error?.code === "auth/invalid-email") {
        Alert.alert("Niepoprawny email", "Podany adres e-mail jest niepoprawny.");
      } else {
        Alert.alert("Błąd", "Nie udało się zaktualizować profilu.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      if (!auth.currentUser) {
        router.replace("/auth");
        return;
      }
      await auth.signOut();
      router.replace("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleAvatar = async () => {
    if (!auth.currentUser) return;
    try {
      const avatar = await pickAndUploadAvatar(auth.currentUser.uid);
      if (!avatar) return;
      await updateCurrentUserData({ avatar });
      setUserData((prev) => ({ ...prev, avatar }));
    } catch {
      Alert.alert("Błąd", "Nie udało się zmienić zdjęcia profilowego.");
    }
  };

  const handlePush = async () => {
    if (!auth.currentUser) return;
    if (Platform.OS === "web") {
      Alert.alert("Powiadomienia", "Powiadomienia push są obsługiwane w aplikacji mobilnej.");
      return;
    }
    try {
      const token = await registerPushToken(auth.currentUser.uid);
      Alert.alert(
        "Powiadomienia",
        token ? "Urządzenie zostało zarejestrowane." : "Nie przyznano uprawnień do powiadomień."
      );
    } catch {
      Alert.alert("Błąd", "Nie udało się zarejestrować powiadomień.");
    }
  };

  const resetPasswordForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
  };

  const openPasswordSheet = () => {
    resetPasswordForm();
    setPasswordOpen(true);
  };

  const closePasswordSheet = () => {
    if (passwordLoading) return;
    setPasswordOpen(false);
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    const user = auth.currentUser;
    if (!user || !user.email) {
      setPasswordError("Musisz być zalogowany, aby zmienić hasło.");
      return;
    }
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Wszystkie pola są wymagane.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Nowe hasło musi mieć co najmniej 6 znaków.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Nowe hasła nie są takie same.");
      return;
    }

    setPasswordLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      await signOut(auth);
      setPasswordOpen(false);
      router.replace("/");
    } catch (err: any) {
      if (
        err?.code === "auth/wrong-password" ||
        err?.code === "auth/invalid-credential"
      ) {
        setPasswordError("Aktualne hasło jest niepoprawne.");
      } else if (err?.code === "auth/requires-recent-login") {
        setPasswordError("Proszę zalogować się ponownie i spróbować zmienić hasło.");
      } else {
        setPasswordError("Coś poszło nie tak. Proszę spróbować ponownie.");
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <SafeAreaContainer>
      <ViewTitle back>Profil</ViewTitle>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isEditing ? (
          <EditProfile
            userData={userData}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <ProfileInfo userData={userData} />
        )}
        {!isEditing && (
          <View style={styles.buttonView}>
            <Button title="Edytuj profil" onPress={() => setIsEditing(true)} />
            {userRole !== "guest" && (
              <>
                <Button title="Zmień zdjęcie profilowe" variant="soft" onPress={handleAvatar} />
                <Button title="Włącz powiadomienia" variant="soft" onPress={handlePush} />
              </>
            )}
            {userRole !== "guest" && (
              <Button
                title="Zmień hasło"
                variant="soft"
                onPress={openPasswordSheet}
              />
            )}
            <Button
              title={
                userRole === "guest" ? "Powrót do logowania" : "Wyloguj się"
              }
              variant="danger"
              onPress={handleLogout}
            />
          </View>
        )}
      </ScrollView>
      <Modal
        visible={passwordOpen}
        transparent
        animationType="slide"
        onRequestClose={closePasswordSheet}
      >
        <KeyboardAvoidingView
          style={styles.modalKeyboardWrap}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable
            style={[styles.modalOverlay, { backgroundColor: t.colors.overlay }]}
            onPress={closePasswordSheet}
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
                Zmień hasło
              </Text>
              <View style={{ gap: 14 }}>
                <TextField
                  label="Aktualne hasło"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  placeholder="••••••"
                />
                <TextField
                  label="Nowe hasło"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  placeholder="min. 6 znaków"
                />
                <TextField
                  label="Powtórz nowe hasło"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholder="••••••"
                  error={passwordError ?? undefined}
                />
                <View style={styles.modalActions}>
                  <Button
                    title="Anuluj"
                    variant="secondary"
                    fullWidth={false}
                    onPress={closePasswordSheet}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Zapisz"
                    fullWidth={false}
                    loading={passwordLoading}
                    onPress={handleChangePassword}
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
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: floatingTabBar.contentBottomPadding,
  },
  buttonView: {
    gap: 12,
  },
  modalKeyboardWrap: { flex: 1 },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: floatingTabBar.contentBottomPadding,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
});

export default Profile;
