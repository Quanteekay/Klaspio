import { Redirect } from "expo-router";
import CheckAuth from "@/src/components/CheckAuth";
import { useEffect, useState } from "react";
import { auth } from "@/FirebaseConfig";
import { getCurrentUserData } from "@/src/services/userApi";

export default function Index() {
  const [userData, setUserData] = useState<any>(null);
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

  if (!userData) {
    return <Redirect href="/auth" />;
  }

  const roleRoutes: Record<string, any> = {
    student: "/(student)/student",
    teacher: "/(teacher)/teacher",
    admin: "/(admin)/admin",
    parent: "/(parent)/parent",
  };

  const route = roleRoutes[userData?.role ?? "guest"] || "/(guest)/guest";

  return <Redirect href={route} />;
}
