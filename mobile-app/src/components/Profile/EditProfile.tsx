import { Pressable, StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";
import { router } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import UserData from "@/src/models/UserData";
import TextField from "@/src/components/ui/TextField";
import Button from "@/src/components/ui/Button";
import { useTheme } from "@/src/theme/useTheme";

interface EditProfileProps {
  userData: UserData;
  onSave: (data: UserData) => void;
  onCancel: () => void;
}

const EditProfile = ({ userData, onSave, onCancel }: EditProfileProps) => {
  const t = useTheme();
  const [formData, setFormData] = useState(userData);

  return (
    <View style={styles.container}>
      <View style={{ gap: 14 }}>
        <TextField
          label="Imię"
          value={formData.firstName}
          onChangeText={(v) => setFormData({ ...formData, firstName: v })}
          placeholder="Imię"
        />
        <TextField
          label="Nazwisko"
          value={formData.surname}
          onChangeText={(v) => setFormData({ ...formData, surname: v })}
          placeholder="Nazwisko"
        />
        <TextField
          label="Email (z Firebase Auth)"
          value={formData.email}
          onChangeText={() => {}}
          editable={false}
        />
      </View>

      <Pressable
        style={[
          styles.actionRow,
          {
            backgroundColor: t.colors.primarySoft,
            borderColor: t.colors.border,
          },
        ]}
        onPress={() => router.push("/profile/changePassword")}
      >
        <View
          style={[styles.actionIcon, { backgroundColor: t.colors.primarySoft }]}
        >
          <FontAwesome name="lock" size={18} color={t.colors.primary} />
        </View>
        <Text style={[styles.actionText, { color: t.colors.primary }]}>
          Zmień hasło
        </Text>
      </Pressable>

      <View style={styles.buttonContainer}>
        <Button
          title="Zapisz"
          fullWidth={false}
          onPress={() => onSave(formData)}
          style={{ flex: 1 }}
        />
        <Button
          title="Anuluj"
          variant="secondary"
          fullWidth={false}
          onPress={onCancel}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  container: { width: "100%", gap: 18 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    gap: 12,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: { fontSize: 15, fontWeight: "700" },
  buttonContainer: { flexDirection: "row", gap: 12 },
});
