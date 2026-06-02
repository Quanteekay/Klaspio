import { useState } from "react";
import { View, Text } from "react-native";
import { router } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { sendUserPasswordReset } from "@/src/services/userApi";
import {
  Screen,
  ScreenHeader,
  TextField,
  Button,
  Card,
  useTheme,
} from "@/src/components/ui";

export default function ForgotPassword() {
  const t = useTheme();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleResetPassword = async () => {
    setError(null);
    if (!email) {
      setError("Proszę wprowadzić adres e-mail.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Proszę wprowadzić poprawny adres e-mail.");
      return;
    }
    try {
      setLoading(true);
      await sendUserPasswordReset(email);
      setEmailSent(true);
    } catch {
      setEmailSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Reset hasła" back />
      <View style={{ paddingHorizontal: 20, gap: 14 }}>
        {!emailSent ? (
          <>
            <Text style={{ color: t.colors.textSecondary, fontSize: 15, lineHeight: 22 }}>
              Wprowadź swój adres e-mail, a wyślemy Ci link do zresetowania
              hasła.
            </Text>
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="twoj@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
              error={error ?? undefined}
            />
            <Button
              title="Zresetuj hasło"
              onPress={handleResetPassword}
              loading={loading}
            />
          </>
        ) : (
          <Card>
            <FontAwesome
              name="paper-plane"
              size={48}
              color={t.colors.primary}
              style={{ alignSelf: "center", marginBottom: 14 }}
            />
            <Text
              style={{
                color: t.colors.textPrimary,
                fontSize: 18,
                fontWeight: "700",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              Sprawdź swoją skrzynkę
            </Text>
            <Text
              style={{
                color: t.colors.textSecondary,
                textAlign: "center",
                fontSize: 14,
                lineHeight: 22,
              }}
            >
              Jeśli konto z tym adresem istnieje, wysłaliśmy link do
              zresetowania hasła. Sprawdź też folder spam.
            </Text>
          </Card>
        )}

        <Button
          title="← Powrót do logowania"
          variant="ghost"
          onPress={() => router.replace("/")}
        />
      </View>
    </Screen>
  );
}
