import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  signOut,
} from "firebase/auth";
import { auth } from "@/FirebaseConfig";
import {
  Screen,
  ScreenHeader,
  TextField,
  Button,
} from "@/src/components/ui";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChangePassword = async () => {
    setError(null);
    const user = auth.currentUser;
    if (!user || !user.email) {
      setError("Musisz być zalogowany, aby zmienić hasło.");
      return;
    }
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Wszystkie pola są wymagane.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Nowe hasło musi mieć co najmniej 6 znaków.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Nowe hasła nie są takie same.");
      return;
    }
    try {
      setLoading(true);
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      await signOut(auth);
      router.replace("/");
    } catch (err: any) {
      if (
        err?.code === "auth/wrong-password" ||
        err?.code === "auth/invalid-credential"
      ) {
        setError("Aktualne hasło jest niepoprawne.");
      } else if (err?.code === "auth/requires-recent-login") {
        setError("Proszę zalogować się ponownie i spróbować zmienić hasło.");
      } else {
        setError("Coś poszło nie tak. Proszę spróbować ponownie.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Zmień hasło" back />
      <View style={{ paddingHorizontal: 20, gap: 14 }}>
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
          error={error ?? undefined}
        />
        <TextField
          label="Powtórz nowe hasło"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          placeholder="••••••"
        />
        <Button
          title="Zapisz nowe hasło"
          onPress={handleChangePassword}
          loading={loading}
          style={{ marginTop: 4 }}
        />
      </View>
    </Screen>
  );
}
