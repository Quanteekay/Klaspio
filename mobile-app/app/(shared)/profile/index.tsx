import { useState, useEffect } from "react";
import { router } from "expo-router";
import {
  getCurrentUserData,
  updateCurrentUserData,
} from "@/src/services/userApi";
import type UserData from "@/src/models/UserData";
import { Alert, Platform, StyleSheet, ScrollView, Text, View } from "react-native";
import ProfileInfo from "@/src/components/Profile/ProfileInfo";
import EditProfile from "@/src/components/Profile/EditProfile";
import ViewTitle from "@/src/components/ViewTitle";
import { auth } from "@/FirebaseConfig";
import SafeAreaContainer from "@/src/components/SafeAreaContainer";
import { Button, Card } from "@/src/components/ui";
import { pickAndUploadAvatar } from "@/src/services/profileMediaApi";
import { registerPushToken } from "@/src/services/notificationsApi";
import { anonymizeUserData, exportUserData } from "@/src/services/privacyApi";
import { floatingTabBar } from "@/src/theme/layout";

const Profile = () => {
  const [userData, setUserData] = useState<UserData>({
    firstName: "Anonymous",
    surname: "Anonymous",
    role: "guest",
    email: "-",
    uid: "-",
    active: true,
  });

  const userRole = userData.role;

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

  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async (updatedData: UserData) => {
    try {
      if (userRole === "guest") {
        setUserData(updatedData);
        setIsEditing(false);
        return;
      }

      if (!userData?.uid) return;

      await updateCurrentUserData({
        firstName: updatedData.firstName,
        surname: updatedData.surname,
      });

      setUserData(updatedData);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
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

  const handleExport = async () => {
    if (!auth.currentUser) return;
    try {
      const data = await exportUserData(auth.currentUser.uid);
      console.log("Eksport danych użytkownika", JSON.stringify(data, null, 2));
      Alert.alert(
        "Eksport danych",
        "Dane zostały przygotowane i wypisane w konsoli developerskiej."
      );
    } catch {
      Alert.alert("Błąd", "Nie udało się wyeksportować danych.");
    }
  };

  const handleAnonymize = () => {
    if (!auth.currentUser) return;
    Alert.alert(
      "Anonimizacja konta",
      "Ta operacja ukryje dane profilu i dezaktywuje konto. Kontynuować?",
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Anonimizuj",
          style: "destructive",
          onPress: async () => {
            try {
              await anonymizeUserData(auth.currentUser!.uid);
              await auth.signOut();
              router.replace("/auth");
            } catch {
              Alert.alert("Błąd", "Nie udało się zanonimizować danych.");
            }
          },
        },
      ]
    );
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
                <Card>
                  <Text style={styles.rodoTitle}>Dane i prywatność</Text>
                  <Text style={styles.rodoText}>
                    Eksport obejmuje profil, lekcje, zadania i frekwencję. Anonimizacja usuwa dane identyfikujące z profilu.
                  </Text>
                  <View style={{ gap: 10, marginTop: 12 }}>
                    <Button title="Eksportuj moje dane" variant="secondary" onPress={handleExport} />
                    <Button title="Usuń / zanonimizuj konto" variant="danger" onPress={handleAnonymize} />
                  </View>
                </Card>
              </>
            )}
            {userRole !== "guest" && (
              <Button
                title="Zmień hasło"
                variant="soft"
                onPress={() => router.push("/profile/changePassword")}
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
  rodoTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
  },
  rodoText: {
    fontSize: 13,
    lineHeight: 19,
  },
  button: {
    backgroundColor: "#4a90e2",
    borderRadius: 8,
    height: 45,
    justifyContent: "center",
  },
  changePasswordButton: {
    backgroundColor: "#5C6BC0",
  },
  logoutButton: {
    backgroundColor: "#e74c3c",
  },
  backToLoginButton: {
    backgroundColor: "#785f30ff",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default Profile;
