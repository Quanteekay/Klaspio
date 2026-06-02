import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  getDoc,
  doc,
  DocumentData,
  QueryDocumentSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import Task from "@/src/models/Task";
import { db } from "@/FirebaseConfig";
import {
  createAppNotification,
  getStudentAndParentRecipients,
} from "@/src/services/notificationsCenterApi";

const COLLECTION_NAME = "Tasks";

export const taskConverter = (
  docSnap: QueryDocumentSnapshot<DocumentData>
): Task => {
  const data = docSnap.data();

  const rawDate = data.date;
  let dateStr: string | undefined = undefined;

  if (rawDate instanceof Timestamp) {
    dateStr = rawDate.toDate().toISOString();
  } else if (typeof rawDate === "string") {
    dateStr = rawDate;
  } else if (rawDate && typeof rawDate.toDate === "function") {
    dateStr = rawDate.toDate().toISOString();
  }

  const rawSubmittedAt = data.submittedAt;
  let submittedAtStr: string | undefined = undefined;

  if (rawSubmittedAt instanceof Timestamp) {
    submittedAtStr = rawSubmittedAt.toDate().toISOString();
  } else if (typeof rawSubmittedAt === "string") {
    submittedAtStr = rawSubmittedAt;
  } else if (rawSubmittedAt && typeof rawSubmittedAt.toDate === "function") {
    submittedAtStr = rawSubmittedAt.toDate().toISOString();
  }

  return {
    id: docSnap.id,
    title: data.title || "",
    userId: data.userId || "",
    subjectId: data.subjectId ?? "",
    groupId: data.groupId ?? undefined,
    teacherId: data.teacherId || "",
    rate: data.rate ?? null,
    comment: data.comment || "",
    commited: !!data.commited,
    taskContent: data.taskContent || "",
    answerContent: data.answerContent || "",
    date: dateStr,
    submittedAt: submittedAtStr,
  };
};

export async function getTasksByTeacher(teacherId: string): Promise<Task[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("teacherId", "==", teacherId)
    );

    const snapshot = await getDocs(q);
    const tasks: Task[] = [];

    snapshot.forEach((doc) => {
      tasks.push(taskConverter(doc as QueryDocumentSnapshot<DocumentData>));
    });

    return tasks;
  } catch (error) {
    console.error("Błąd podczas pobierania zadań:", error);
    return [];
  }
}

export async function getTaskById(taskId: string): Promise<Task | null> {
  try {
    const ref = doc(db, COLLECTION_NAME, taskId);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    return taskConverter(snap as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    console.error("Error loading task:", error);
    return null;
  }
}

export async function updateTaskGradeAndStatus(
  taskId: string,
  rate: number | null,
  comment: string,
  commited: boolean
): Promise<void> {
  const ref = doc(db, COLLECTION_NAME, taskId);

  const updateData: {
    rate: number | null;
    comment: string;
    commited: boolean;
  } = {
    rate: rate,
    comment: comment,
    commited: commited,
  };

  try {
    const snap = await getDoc(ref);
    const task = snap.exists()
      ? taskConverter(snap as QueryDocumentSnapshot<DocumentData>)
      : null;
    await updateDoc(ref, updateData);
    if (task && (commited || rate !== null)) {
      const recipients = await getStudentAndParentRecipients([task.userId]);
      await createAppNotification({
        type: "grade_added",
        title: "Nowa ocena",
        body: `Zadanie "${task.title}" zostało ocenione${rate !== null ? `: ${rate}/100` : "."}`,
        targetUserIds: recipients,
        createdBy: task.teacherId,
        relatedPath: `/student/homework/${taskId}`,
        relatedId: taskId,
      });
    }
  } catch (error) {
    console.error("Błąd podczas aktualizacji zadania:", error);
    throw new Error("Nie udało się zaktualizować zadania w Firestore.");
  }
}

export const createTask = async (task: {
  title: string;
  taskContent: string;
  userId: string;
  subjectId: string;
  groupId?: string;
  teacherId: string;
}): Promise<void> => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    title: task.title.trim(),
    taskContent: task.taskContent.trim(),
    userId: task.userId,
    subjectId: task.subjectId,
    groupId: task.groupId ?? "",
    teacherId: task.teacherId,
    rate: null,
    comment: "",
    commited: false,
    answerContent: "",
    date: serverTimestamp(),
  });
  const recipients = await getStudentAndParentRecipients([task.userId]);
  await createAppNotification({
    type: "task_created",
    title: "Nowe zadanie",
    body: `Dodano zadanie: ${task.title.trim()}`,
    targetUserIds: recipients,
    createdBy: task.teacherId,
    relatedPath: `/student/homework/${docRef.id}`,
    relatedId: docRef.id,
  });
};

export interface Student {
  uid: string;
  firstName: string;
  surname: string;
}

export async function getStudents(): Promise<Student[]> {
  try {
    const q = query(collection(db, "users"), where("role", "==", "student"));

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        uid: data.uid, // ✅ UID z Firebase Auth
        firstName: data.firstName ?? "",
        surname: data.surname ?? "",
      };
    });
  } catch (error) {
    console.error("Błąd podczas pobierania studentów:", error);
    return [];
  }
}

export async function getStudentByUid(uid: string): Promise<Student | null> {
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    const data = snap.data();
    return {
      uid,
      firstName: data.firstName ?? "",
      surname: data.surname ?? "",
    };
  } catch (error) {
    console.error("Błąd podczas pobierania studenta po UID:", error);
    return null;
  }
}
