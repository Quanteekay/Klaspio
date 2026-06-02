import { db } from "@/FirebaseConfig";
import { doc, getDocs, query, updateDoc, where, collection } from "firebase/firestore";
import { getAttendanceByStudent } from "@/src/services/attendanceApi";
import { getLessonsByStudent } from "@/src/services/lessonsApi";
import { getTasksByStudent } from "@/src/services/studentApi";
import { getUserDataByUid } from "@/src/services/userApi";
import type UserData from "@/src/models/UserData";

export interface UserDataExport {
  exportedAt: string;
  profile: UserData | null;
  tasks: unknown[];
  lessons: unknown[];
  attendance: unknown[];
}

export async function exportUserData(userId: string): Promise<UserDataExport> {
  const [profile, tasks, lessons, attendance] = await Promise.all([
    getUserDataByUid(userId),
    getTasksByStudent(userId),
    getLessonsByStudent(userId),
    getAttendanceByStudent(userId),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    profile,
    tasks,
    lessons,
    attendance,
  };
}

export async function anonymizeUserData(userId: string): Promise<void> {
  await updateDoc(doc(db, "users", userId), {
    firstName: "Usunięty",
    surname: "Użytkownik",
    email: "",
    avatar: "",
    active: false,
  });

  const taskSnap = await getDocs(
    query(collection(db, "Tasks"), where("userId", "==", userId))
  );
  await Promise.all(
    taskSnap.docs.map((taskDoc) =>
      updateDoc(taskDoc.ref, {
        answerContent: "",
        comment: "",
      })
    )
  );
}
