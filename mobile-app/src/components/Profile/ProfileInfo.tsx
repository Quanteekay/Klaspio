import { Text, StyleSheet, View, Image } from "react-native";
import React from "react";
import UserData from "@/src/models/UserData";
import { UserRole } from "@/src/models/UserRole";
import { useTheme } from "@/src/theme/useTheme";

interface ProfileInfoProps {
  userData: UserData;
}

const ProfileInfo = ({ userData }: ProfileInfoProps) => {
  const t = useTheme();

  const getRoleDisplay = (role: UserRole) => {
    if (!role) return "Unknown";
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "admin":
        return t.colors.danger;
      case "teacher":
        return t.colors.warning;
      case "student":
        return t.colors.success;
      case "parent":
        return t.colors.primary;
      default:
        return t.colors.textMuted;
    }
  };

  const initials = `${userData.firstName?.[0] ?? ""}${
    userData.surname?.[0] ?? ""
  }`.toUpperCase();

  const cardStyle = [
    styles.infoCard,
    { backgroundColor: t.colors.surface, borderColor: t.colors.border },
    t.shadows.card,
  ];

  return (
    <View style={styles.container}>
      <View style={styles.avatarWrapper}>
        {userData.avatar ? (
          <Image
            source={{ uri: userData.avatar }}
            style={[styles.avatar, { borderColor: t.colors.border }]}
          />
        ) : (
          <View
            style={[
              styles.avatar,
              styles.avatarFallback,
              { backgroundColor: t.colors.primary, borderColor: t.colors.border },
            ]}
          >
            <Text style={styles.avatarInitials}>{initials || "?"}</Text>
          </View>
        )}
      </View>

      <View style={cardStyle}>
        <Text style={[styles.label, { color: t.colors.textMuted }]}>
          Imię i nazwisko
        </Text>
        <Text
          style={[styles.fullName, { color: t.colors.textPrimary }]}
          numberOfLines={1}
        >
          {`${userData.firstName ?? ""} ${userData.surname ?? ""}`.trim() || "—"}
        </Text>
      </View>

      <View style={cardStyle}>
        <Text style={[styles.label, { color: t.colors.textMuted }]}>Email</Text>
        <Text
          style={[styles.value, { color: t.colors.textPrimary }]}
          numberOfLines={1}
        >
          {userData.email}
        </Text>
      </View>

      <View style={cardStyle}>
        <Text style={[styles.label, { color: t.colors.textMuted }]}>Rola</Text>
        <View
          style={[
            styles.roleBadge,
            { backgroundColor: getRoleBadgeColor(userData.role) },
          ]}
        >
          <Text style={styles.roleText}>{getRoleDisplay(userData.role)}</Text>
        </View>
      </View>
    </View>
  );
};

export default ProfileInfo;

const styles = StyleSheet.create({
  container: { width: "100%" },
  avatarWrapper: { alignItems: "center", marginBottom: 20 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
  },
  avatarFallback: { justifyContent: "center", alignItems: "center" },
  avatarInitials: { color: "#FFFFFF", fontSize: 36, fontWeight: "700" },
  infoCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fullName: { fontSize: 20, fontWeight: "700" },
  value: { fontSize: 16, fontWeight: "500" },
  roleBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  roleText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
