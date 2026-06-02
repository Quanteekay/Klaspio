import { Redirect, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { auth } from "@/FirebaseConfig";
import { getCurrentUserData } from "@/src/services/userApi";
import CheckAuth from "@/src/components/CheckAuth";
import type UserData from "@/src/models/UserData";

export default function TeacherLayout() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        const currentUser = await getCurrentUserData();
        setUserData(currentUser);
      } catch (error) {
        console.log("Error loading user profile:", error);
      } finally {
        setIsCheckingAuth(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (isCheckingAuth) {
    return <CheckAuth />;
  }

  if (userData?.role !== "teacher") {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    />
  );
}
