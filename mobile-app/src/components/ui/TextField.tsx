import { useState } from "react";
import {
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from "react-native";
import { useTheme } from "@/src/theme/useTheme";

interface TextFieldProps {
  value: string;
  onChangeText: (v: string) => void;
  label?: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  editable?: boolean;
  error?: string;
}

export default function TextField({
  value,
  onChangeText,
  label,
  placeholder,
  secureTextEntry,
  multiline,
  keyboardType,
  autoCapitalize,
  editable = true,
  error,
}: TextFieldProps) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? t.colors.danger
    : focused
    ? t.colors.primary
    : t.colors.border;

  return (
    <View style={{ width: "100%" }}>
      {label ? (
        <Text
          style={[
            t.typography.label,
            { color: t.colors.textSecondary, marginBottom: 8 },
          ]}
        >
          {label}
        </Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.colors.textMuted}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={editable}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        textAlignVertical={multiline ? "top" : "center"}
        style={{
          backgroundColor: editable ? t.colors.surface : t.colors.surfaceAlt,
          borderWidth: 1.5,
          borderColor,
          borderRadius: t.radii.md,
          paddingHorizontal: 16,
          paddingVertical: 14,
          minHeight: multiline ? 120 : 52,
          fontSize: 16,
          color: t.colors.textPrimary,
        }}
      />
      {error ? (
        <Text
          style={{ color: t.colors.danger, fontSize: 12, marginTop: 6 }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
