import { StyleSheet, View } from "react-native";
import React, { useState } from "react";
import UserData from "@/src/models/UserData";
import TextField from "@/src/components/ui/TextField";
import Button from "@/src/components/ui/Button";

interface EditProfileProps {
  userData: UserData;
  onSave: (data: UserData) => void | Promise<void>;
  onCancel: () => void;
}

const EditProfile = ({ userData, onSave, onCancel }: EditProfileProps) => {
  const [formData, setFormData] = useState(userData);

  return (
    <View style={styles.container}>
      <View style={{ gap: 14 }}>
        <TextField
          label="Imię"
          value={formData.firstName}
          onChangeText={() => {}}
          placeholder="Imię"
          editable={false}
        />
        <TextField
          label="Nazwisko"
          value={formData.surname}
          onChangeText={() => {}}
          placeholder="Nazwisko"
          editable={false}
        />
        <TextField
          label="Email"
          value={formData.email}
          onChangeText={(v) => setFormData({ ...formData, email: v })}
          placeholder="twoj@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

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
  buttonContainer: { flexDirection: "row", gap: 12 },
});
