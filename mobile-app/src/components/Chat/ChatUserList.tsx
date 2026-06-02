import UserData from "@/src/models/UserData";
import { UserRole } from "@/src/models/UserRole";
import { getAllUsers } from "@/src/services/userApi";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { floatingTabBar } from "@/src/theme/layout";

const ChatUserList = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchText, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      // In a chat list, we usually only want to see Active users
      const activeUsers = data.filter((u: UserData) => u.active);
      setUsers(activeUsers);
      setFilteredUsers(activeUsers);
    } catch (error: any) {
      alert("Błąd pobierania kontaktów: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let result = users;
    if (searchText) {
      result = result.filter(
        (u) =>
          u.surname.toLowerCase().includes(searchText.toLowerCase()) ||
          u.firstName.toLowerCase().includes(searchText.toLowerCase()) ||
          u.email.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    if (roleFilter !== "all") {
      result = result.filter((u) => u.role === roleFilter);
    }
    setFilteredUsers(result);
  };

  const openChat = (user: UserData) => {
    router.push({
      pathname: "/chat",
      params: {
        id: user.uid,
        title: `${user.firstName} ${user.surname}`,
      },
    });
  };

  const renderUserItem = ({ item }: { item: UserData }) => (
    <TouchableOpacity style={styles.userCard} onPress={() => openChat(item)}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {item.firstName.charAt(0)}
            {item.surname.charAt(0)}
          </Text>
        </View>
      </View>

      <View style={styles.cardInfo}>
        <View style={styles.cardHeader}>
          <Text style={styles.userName}>
            {item.firstName} {item.surname}
          </Text>
        </View>
        <Text style={styles.userEmail}>{item.email}</Text>
        <View style={styles.roleContainer}>
          <View
            style={[
              styles.roleBadge,
              {
                backgroundColor:
                  item.role === "admin"
                    ? "#E91E63"
                    : item.role === "teacher"
                    ? "#FF9800"
                    : "#4CAF50",
              },
            ]}
          >
            <Text style={styles.roleText}>{item.role}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionIcon}>
        <MaterialIcons name="chat-bubble-outline" size={24} color="#5C6BC0" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={28} color="#1A237E" />
        </TouchableOpacity>
        <Text style={styles.title}>Nowa Wiadomość</Text>
        {/* Placeholder View to balance the header since we removed the Add button */}
        <View style={{ width: 38 }} />
      </View>

      {/* FILTERS */}
      <View style={styles.filtersContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Szukaj osoby..."
          value={searchText}
          onChangeText={setSearchText}
        />
        <View style={styles.chipsRow}>
          {(["all", "student", "teacher", "admin"] as const).map((role) => (
            <TouchableOpacity
              key={role}
              style={[styles.chip, roleFilter === role && styles.chipActive]}
              onPress={() => setRoleFilter(role)}
            >
              <Text
                style={[
                  styles.chipText,
                  roleFilter === role && styles.chipTextActive,
                ]}
              >
                {role === "all" ? "Wszyscy" : role}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* LIST */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#5C6BC0"
          style={{ marginTop: 20 }}
        />
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nie znaleziono użytkowników.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default ChatUserList;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5", width: "100%" },

  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#E0E0E0",
  },
  backButton: { padding: 5 },
  title: { fontSize: 22, fontWeight: "800", color: "#1A237E" },

  // Filters
  filtersContainer: {
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#E0E0E0",
  },
  searchInput: {
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 12,
  },
  chipsRow: { flexDirection: "row", justifyContent: "space-between" },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 25,
    backgroundColor: "#EEEEEE",
  },
  chipActive: { backgroundColor: "#5C6BC0" },
  chipText: { color: "#616161", fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: "#FFF" },

  // List
  listContent: { padding: 15, paddingBottom: floatingTabBar.contentBottomPadding },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#757575",
    fontSize: 16,
  },

  // User Cards (Redesigned for Chat Context)
  userCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  avatarContainer: { marginRight: 15 },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E8EAF6",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#3949AB",
    fontWeight: "bold",
    fontSize: 18,
  },
  cardInfo: { flex: 1 },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
  userName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  userEmail: { fontSize: 13, color: "#757575", marginBottom: 4 },

  roleContainer: { flexDirection: "row" },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  roleText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },

  actionIcon: {
    paddingLeft: 10,
  },
});
