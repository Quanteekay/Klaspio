import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { router } from "expo-router";
import { auth } from "@/FirebaseConfig";
import { Text, View } from "react-native";
import { Screen, ScreenHeader, TextField, Button, useTheme } from "@/src/components/ui";
import { getAuthErrorMessage } from "@/src/utils/authErrorMessages";

export default function RegisterPage() {
  const t = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async () => {
    setError(null);
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      setError("Wypełnij email i hasło.");
      return;
    }
    if (password.length < 6) {
      setError("Hasło musi mieć co najmniej 6 znaków.");
      return;
    }
    setIsLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      router.back();
    } catch (error) {
      setError(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Zarejestruj się" subtitle="Utwórz nowe konto" back />
      <View style={{ paddingHorizontal: 20, gap: 14 }}>
        <TextField
          label="Email"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setError(null);
          }}
          placeholder="twoj@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextField
          label="Hasło"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setError(null);
          }}
          placeholder="min. 6 znaków"
          secureTextEntry
        />
        {error ? (
          <Text style={{ color: t.colors.danger, fontSize: 13, fontWeight: "600" }}>
            {error}
          </Text>
        ) : null}
        <Button
          title={isLoading ? "Tworzenie konta..." : "Utwórz konto"}
          onPress={register}
          loading={isLoading}
          style={{ marginTop: 4 }}
        />
      </View>
    </Screen>
  );
}
