import { db } from "@/FirebaseConfig";
import {
  collection,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  query,
  QueryDocumentSnapshot,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getUserDataByUid } from "@/src/services/userApi";
import { taskConverter } from "@/src/services/tasksApi";
import type Task from "@/src/models/Task";

const COLLECTION_NAME = "Tasks";

export type RatingSubject = {
  uid: string;
  title: string;
  commited: boolean;
  taskContent: string;
  rate: number;
  comment: string;
  teacherName: string;
  subjectId: string;
};

function queryTasksByUserId(userId: string) {
  return query(collection(db, COLLECTION_NAME), where("userId", "==", userId));
}

export async function getRatingSubjects(
  userId: string
): Promise<RatingSubject[]> {
  try {
    const q = queryTasksByUserId(userId);

    const snapshot = await getDocs(q);
    // brak zadań → brak ocen; nie próbujemy ciągnąć nauczyciela z pustej listy
    // (doc(db,"users","") rzuca błąd Firestore i syfi konsolę w dev mode)
    if (snapshot.empty) return [];

    const teacherIds = Array.from(
      new Set(
        snapshot.docs
          .map((doc) => doc.data().teacherId)
          .filter((teacherId): teacherId is string => typeof teacherId === "string" && teacherId.length > 0)
      )
    );
    const teacherEntries = await Promise.all(
      teacherIds.map(async (teacherId) => [teacherId, await getUserDataByUid(teacherId)] as const)
    );
    const teacherById = new Map(teacherEntries);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      const teacher = teacherById.get(data.teacherId) ?? null;

      return {
        uid: doc.id,
        title: data.title ?? "",
        taskContent: data.taskContent ?? "",
        commited: Boolean(data.commited),
        rate: data.rate ?? 0,
        comment: data.comment ?? "",
        subjectId: data.subjectId ?? "",
        teacherName: teacher
          ? `${teacher.firstName} ${teacher.surname}`
          : "Nieznany nauczyciel",
      };
    });
  } catch (error) {
    console.error("Błąd podczas pobierania ocen:", error);
    return [];
  }
}

export async function getTasksByStudent(studentId: string): Promise<Task[]> {
  try {
    const q = queryTasksByUserId(studentId);

    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];

    const teacherIds = Array.from(
      new Set(
        snapshot.docs
          .map((doc) => doc.data().teacherId)
          .filter((teacherId): teacherId is string => typeof teacherId === "string" && teacherId.length > 0)
      )
    );
    const teacherEntries = await Promise.all(
      teacherIds.map(async (teacherId) => [teacherId, await getUserDataByUid(teacherId)] as const)
    );
    const teacherById = new Map(teacherEntries);

    const tasks: Task[] = [];

    snapshot.forEach((doc) => {
      const task = taskConverter(doc as QueryDocumentSnapshot<DocumentData>);
      const teacher = teacherById.get(task.teacherId) ?? null;

      if (teacher) {
        task.teacherName = `${teacher.firstName} ${teacher.surname}`;
      } else {
        task.teacherName = "Nieznany nauczyciel";
      }
      tasks.push(task);
    });

    return tasks;
  } catch (error) {
    console.error("Błąd podczas pobierania zadań studenta:", error);
    return [];
  }
}

export async function getSingleTaskById(taskId: string): Promise<Task | null> {
  try {
    const ref = doc(db, COLLECTION_NAME, taskId);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    const teacher = await getUserDataByUid(snap.data().teacherId);
    const task = taskConverter(snap as QueryDocumentSnapshot<DocumentData>);

    if (teacher) {
      task.teacherName = `${teacher.firstName} ${teacher.surname}`;
    } else {
      task.teacherName = "Nieznany nauczyciel";
    }

    return task;
  } catch (error) {
    console.error("Błąd podczas pobierania zadania:", error);
    return null;
  }
}

export async function submitTaskAnswer(
  taskId: string,
  answerContent: string
): Promise<void> {
  const ref = doc(db, COLLECTION_NAME, taskId);
  try {
    await updateDoc(ref, {
      answerContent: answerContent,
      submittedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Błąd podczas wysyłania odpowiedzi:", error);
    throw new Error("Nie udało się zapisać odpowiedzi.");
  }
}
