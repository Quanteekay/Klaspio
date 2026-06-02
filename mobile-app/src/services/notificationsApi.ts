import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { arrayUnion, doc, updateDoc } from "firebase/firestore";
import { db } from "@/FirebaseConfig";

function permissionGranted(permission: Notifications.NotificationPermissionsStatus): boolean {
  const normalized = permission as { granted?: boolean; status?: string };
  return normalized.granted === true || normalized.status === "granted";
}

export async function registerPushToken(userId: string): Promise<string | null> {
  if (Platform.OS === "web") return null;

  const permission = await Notifications.getPermissionsAsync();
  const finalPermission =
    permissionGranted(permission)
      ? permission
      : await Notifications.requestPermissionsAsync();

  if (!permissionGranted(finalPermission)) return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  const token = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined
  );

  await updateDoc(doc(db, "users", userId), {
    pushTokens: arrayUnion(token.data),
  });

  return token.data;
}

export function setupForegroundNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}
