import { db } from "@/FirebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import type Lesson from "@/src/models/Lesson";
export {
  computeDurationMin,
  lessonsConflict,
  LESSON_BREAK_MIN,
  LESSON_UNIT_MIN,
  unitsFromDuration,
} from "@/src/domain/lessonLogic";
import {
  computeDurationMin,
  LESSON_BREAK_MIN,
  lessonsConflict,
} from "@/src/domain/lessonLogic";
import {
  createAppNotification,
  getStudentAndParentRecipients,
} from "@/src/services/notificationsCenterApi";

const COLLECTION_NAME = "Lessons";

function parseDate(rawDate: unknown): string {
  if (rawDate instanceof Timestamp) return rawDate.toDate().toISOString();
  if (typeof rawDate === "string") return rawDate;
  if (
    rawDate &&
    typeof (rawDate as { toDate?: () => Date }).toDate === "function"
  ) {
    return (rawDate as { toDate: () => Date }).toDate().toISOString();
  }
  return "";
}

const lessonConverter = (
  docSnap: QueryDocumentSnapshot<DocumentData>
): Lesson => {
  const data = docSnap.data();

  return {
    id: docSnap.id,
    courseId: data.courseId ?? "",
    subjectId: data.subjectId ?? data.courseId ?? "",
    groupId: data.groupId ?? undefined,
    teacherId: data.teacherId ?? "",
    studentIds: Array.isArray(data.studentIds) ? data.studentIds : [],
    date: parseDate(data.date),
    durationMin: data.durationMin ?? 0,
    topic: data.topic ?? "",
    summary: data.summary ?? "",
    materials: Array.isArray(data.materials) ? data.materials : [],
    location: data.location ?? "",
    online: data.online ?? false,
    meetingUrl: data.meetingUrl ?? "",
  };
};

function sortByDateAsc(lessons: Lesson[]): Lesson[] {
  return lessons.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateA - dateB;
  });
}

export async function getLessonsByStudent(
  studentId: string
): Promise<Lesson[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("studentIds", "array-contains", studentId)
    );
    const snapshot = await getDocs(q);
    return sortByDateAsc(
      snapshot.docs.map((d) =>
        lessonConverter(d as QueryDocumentSnapshot<DocumentData>)
      )
    );
  } catch (error) {
    console.error("Błąd podczas pobierania lekcji ucznia:", error);
    throw new Error("Nie udało się pobrać lekcji.");
  }
}

export async function getLessonsByTeacher(
  teacherId: string
): Promise<Lesson[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("teacherId", "==", teacherId)
    );
    const snapshot = await getDocs(q);
    return sortByDateAsc(
      snapshot.docs.map((d) =>
        lessonConverter(d as QueryDocumentSnapshot<DocumentData>)
      )
    );
  } catch (error) {
    console.error("Błąd podczas pobierania lekcji nauczyciela:", error);
    throw new Error("Nie udało się pobrać lekcji.");
  }
}

export async function getLessonById(lessonId: string): Promise<Lesson | null> {
  try {
    const ref = doc(db, COLLECTION_NAME, lessonId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return lessonConverter(snap as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    console.error("Błąd podczas pobierania lekcji:", error);
    return null;
  }
}

export type LessonInput = Omit<Lesson, "id">;

export async function createLesson(lesson: LessonInput): Promise<void> {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...lesson,
      date: lesson.date ? Timestamp.fromDate(new Date(lesson.date)) : null,
    });
    const recipients = await getStudentAndParentRecipients(lesson.studentIds);
    await createAppNotification({
      type: "lesson_created",
      title: "Nowa lekcja w grafiku",
      body: `Dodano lekcję: ${lesson.topic || lesson.courseId || "Lekcja"}.`,
      targetUserIds: [...recipients, lesson.teacherId],
      createdBy: lesson.teacherId,
      relatedPath: `/lesson/${docRef.id}`,
      relatedId: docRef.id,
    });
  } catch (error) {
    console.error("Błąd podczas tworzenia lekcji:", error);
    throw new Error("Nie udało się utworzyć lekcji.");
  }
}

export async function updateLesson(
  lessonId: string,
  lesson: Partial<LessonInput>
): Promise<void> {
  try {
    const ref = doc(db, COLLECTION_NAME, lessonId);
    const payload: DocumentData = { ...lesson };
    if (lesson.date) {
      payload.date = Timestamp.fromDate(new Date(lesson.date));
    }
    await updateDoc(ref, payload);
    const current = await getLessonById(lessonId);
    if (current) {
      const recipients = await getStudentAndParentRecipients(current.studentIds);
      await createAppNotification({
        type: "lesson_updated",
        title: "Zmieniono lekcję",
        body: `Zaktualizowano lekcję: ${current.topic || current.courseId || "Lekcja"}.`,
        targetUserIds: [...recipients, current.teacherId],
        createdBy: current.teacherId,
        relatedPath: `/lesson/${lessonId}`,
        relatedId: lessonId,
      });
    }
  } catch (error) {
    console.error("Błąd podczas aktualizacji lekcji:", error);
    throw new Error("Nie udało się zaktualizować lekcji.");
  }
}

export type LessonImplementationInput = Pick<
  Lesson,
  "topic" | "summary" | "materials"
>;

export async function updateLessonImplementation(
  lessonId: string,
  input: Partial<LessonImplementationInput>
): Promise<void> {
  try {
    const payload: DocumentData = {};
    if (input.topic !== undefined) payload.topic = input.topic.trim();
    if (input.summary !== undefined) payload.summary = input.summary.trim();
    if (input.materials !== undefined) {
      payload.materials = input.materials
        .map((item) => item.trim())
        .filter(Boolean);
    }
    await updateDoc(doc(db, COLLECTION_NAME, lessonId), payload);
    const current = await getLessonById(lessonId);
    if (current) {
      const recipients = await getStudentAndParentRecipients(current.studentIds);
      await createAppNotification({
        type: "lesson_updated",
        title: "Uzupełniono realizację lekcji",
        body: `Nauczyciel zaktualizował temat, podsumowanie lub materiały.`,
        targetUserIds: recipients,
        createdBy: current.teacherId,
        relatedPath: `/lesson/${lessonId}`,
        relatedId: lessonId,
      });
    }
  } catch (error) {
    console.error("Błąd podczas aktualizacji realizacji lekcji:", error);
    throw new Error("Nie udało się zaktualizować realizacji lekcji.");
  }
}

export async function deleteLesson(lessonId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, lessonId));
  } catch (error) {
    console.error("Błąd podczas usuwania lekcji:", error);
    throw new Error("Nie udało się usunąć lekcji.");
  }
}

/** ISO date -> 'YYYY-MM-DD' (klucz dla react-native-calendars). */
export function toCalendarDay(isoDate: string): string {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}
