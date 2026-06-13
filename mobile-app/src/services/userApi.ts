import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  collection,
  getDocs,
  query,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
  sendPasswordResetEmail,
  updateEmail,
} from "firebase/auth";
import { initializeApp, getApp, deleteApp, FirebaseApp } from "firebase/app";
import { auth, db } from "@/FirebaseConfig";
import UserData from "@/src/models/UserData";

export const getCurrentUserData = async (): Promise<UserData> => {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("No user is currently logged in");
  }

  try {
    const userRef = doc(db, "users", currentUser.uid);
    const snap = await getDoc(userRef);

    const defaultProfile: UserData = {
      firstName: "Anonymous",
      surname: "Anonymous",
      role: "student",
      email: currentUser.email ?? "N/A",
      uid: currentUser.uid,
      active: true,
    };

    if (snap.exists()) {
      const data = snap.data();
      return {
        firstName: data.firstName ?? "Anonymous",
        surname: data.surname ?? "Anonymous",
        role: data.role ?? "student",
        email: currentUser.email ?? "N/A", // zawsze z auth
        uid: currentUser.uid,
        active: data.active ?? true,
        avatar: data.avatar ?? undefined,
        children: data.children ?? [],
      };
    } else {
      // Utwórz profil jeśli nie istnieje
      await setDoc(userRef, defaultProfile);
      return defaultProfile;
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
};

export const updateCurrentUserData = async (
  data: Partial<UserData>
): Promise<void> => {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("No user is currently logged in");
  }

  try {
    const userRef = doc(db, "users", currentUser.uid);

    const { email, uid, ...updateData } = data;

    await updateDoc(userRef, updateData);
  } catch (error) {
    console.error("Error updating user data:", error);
    throw error;
  }
};

export const updateCurrentUserEmail = async (email: string): Promise<void> => {
  const currentUser = auth.currentUser;
  const normalizedEmail = email.trim().toLowerCase();

  if (!currentUser) {
    throw new Error("No user is currently logged in");
  }

  const allUsers = await getAllUsers();
  const emailTaken = allUsers.some(
    (user) =>
      user.uid !== currentUser.uid &&
      user.email.trim().toLowerCase() === normalizedEmail
  );

  if (emailTaken) {
    const error = new Error("Ten adres e-mail jest już używany.");
    (error as Error & { code?: string }).code = "auth/email-already-in-use";
    throw error;
  }

  if (currentUser.email?.trim().toLowerCase() !== normalizedEmail) {
    await updateEmail(currentUser, normalizedEmail);
  }

  await updateDoc(doc(db, "users", currentUser.uid), {
    email: normalizedEmail,
  });
};

// Pobieranie wszystkich
export const getAllUsers = async (): Promise<UserData[]> => {
  try {
    const q = query(collection(db, "users"));
    const querySnapshot = await getDocs(q);

    const users: UserData[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        firstName: data.firstName ?? "Nieznane",
        surname: data.surname ?? "Nieznane",
        role: data.role ?? "student",
        email: data.email ?? "brak@email.com",
        uid: doc.id,
        active: data.active ?? true,
        avatar: data.avatar ?? undefined,
        children: data.children ?? [],
      });
    });
    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const getUserDataByUid = async (
  uid: string
): Promise<UserData | null> => {
  try {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data();
      return {
        firstName: data.firstName ?? "Nieznane",
        surname: data.surname ?? "Nieznane",
        role: data.role ?? "student",
        email: data.email ?? "",
        uid: snap.id,
        active: data.active ?? true,
        avatar: data.avatar ?? undefined,
        children: data.children ?? [],
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching user by UID:", error);
    throw error;
  }
};

// Aktualizacja danych
export const updateUserDataByUid = async (
  uid: string,
  data: Partial<UserData>
): Promise<void> => {
  const userRef = doc(db, "users", uid);
  // Usuwamy email i uid z danych do aktualizacji, bo tego nie zmieniamy w edycji profilu
  const { email, uid: _omit, ...rest } = data as any;

  // Firestore odrzuca pola o wartości undefined w updateDoc — odsiewamy je,
  // żeby np. brak awatara nie wywalał całej operacji zapisu.
  const payload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rest)) {
    if (v !== undefined) payload[k] = v;
  }

  await updateDoc(userRef, payload);
};

// Nowa funkcja: Tworzenie użytkownika (logika ze starego pliku)
export const createNewUser = async (
  newUser: UserData,
  password: string
): Promise<void> => {
  let secondaryApp: FirebaseApp | undefined;
  try {
    const firebaseConfig = getApp().options;
    // Tworzymy drugą instancję apki, żeby nie wylogować admina
    secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
    const secondaryAuth = getAuth(secondaryApp);

    const userCredential = await createUserWithEmailAndPassword(
      secondaryAuth,
      newUser.email,
      password
    );
    const newUid = userCredential.user.uid;

    // Wyloguj z tymczasowej sesji
    await signOut(secondaryAuth);

    // Zapisz dane do Firestore (używając głównej instancji db)
    await setDoc(doc(db, "users", newUid), {
      firstName: newUser.firstName,
      surname: newUser.surname,
      role: newUser.role,
      email: newUser.email,
      active: newUser.active,
      uid: newUid,
      children: newUser.children ?? [],
    });
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  } finally {
    if (secondaryApp) {
      try {
        await deleteApp(secondaryApp);
      } catch (e) {
        console.log("Cleanup warning:", e);
      }
    }
  }
};

// Nowa funkcja: Reset hasła
export const sendUserPasswordReset = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};
