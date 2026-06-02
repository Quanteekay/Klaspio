import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { router } from "expo-router";
import { auth } from "@/FirebaseConfig";
import { Pressable, Text, View } from "react-native";
import {
  Screen,
  ScreenHeader,
  TextField,
  Button,
  useTheme,
} from "@/src/components/ui";
import { getAuthErrorMessage } from "@/src/utils/authErrorMessages";

export default function Index() {
  const t = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    setError(null);
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      setError("Wypełnij email i hasło.");
      return;
    }
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, normalizedEmail, password);
      router.push("/");
    } catch (error) {
      setError(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Zaloguj się" subtitle="Witaj w Klaspio" />
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
          placeholder="••••••••"
          secureTextEntry
        />
        {error ? (
          <Text style={{ color: t.colors.danger, fontSize: 13, fontWeight: "600" }}>
            {error}
          </Text>
        ) : null}

        <Pressable
          onPress={() => router.push("/auth/forgotPassword")}
          style={{ alignSelf: "flex-end" }}
          hitSlop={8}
        >
          <Text style={{ color: t.colors.primary, fontWeight: "600" }}>
            Zapomniałeś hasła?
          </Text>
        </Pressable>

        <View style={{ gap: 12, marginTop: 4 }}>
          <Button
            title={isLoading ? "Logowanie..." : "Zaloguj"}
            onPress={signIn}
            loading={isLoading}
          />
          <Button
            title="Utwórz konto"
            variant="soft"
            onPress={() => router.push("/auth/register")}
          />
          <Button
            title="Wejdź jako gość"
            variant="ghost"
            onPress={() => router.push("/(guest)/guest")}
          />
        </View>
      </View>
    </Screen>
  );
}
