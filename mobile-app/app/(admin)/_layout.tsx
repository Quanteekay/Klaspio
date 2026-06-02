import { useEffect, useState } from "react";
import { Redirect, Stack } from "expo-router";
import { auth } from "@/FirebaseConfig";
import { getCurrentUserData } from "@/src/services/userApi";
import CheckAuth from "@/src/components/CheckAuth";
import type UserData from "@/src/models/UserData";

export default function AdminLayout() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setIsCheckingAuth(false);
        return;
      }
      try {
        setUserData(await getCurrentUserData());
      } catch (error) {
        console.log("Error loading user profile:", error);
      } finally {
        setIsCheckingAuth(false);
      }
    });
    return () => unsubscribe();
  }, []);

  if (isCheckingAuth) return <CheckAuth />;
  if (userData?.role !== "admin") return <Redirect href="/" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    />
  );
}
