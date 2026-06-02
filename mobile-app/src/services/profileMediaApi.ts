import { storage } from "@/FirebaseConfig";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Platform } from "react-native";

export async function pickAndUploadAvatar(userId: string): Promise<string | null> {
  if (Platform.OS === "web") return null;

  const ImagePicker = await import("expo-image-picker");
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled || !result.assets[0]?.uri) return null;

  const response = await fetch(result.assets[0].uri);
  const blob = await response.blob();
  const avatarRef = ref(storage, `avatars/${userId}.jpg`);
  await uploadBytes(avatarRef, blob, { contentType: "image/jpeg" });
  return getDownloadURL(avatarRef);
}
