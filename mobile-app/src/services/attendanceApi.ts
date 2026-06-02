import { db } from "@/FirebaseConfig";
import {
  collection,
  doc,
  query,
  where,
  getDocs,
  setDoc,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import type Attendance from "@/src/models/Attendance";
import type { AttendanceStatus } from "@/src/models/Attendance";
export type { AttendanceStats } from "@/src/domain/attendanceLogic";
export { getAttendanceStats } from "@/src/domain/attendanceLogic";
import {
  createAppNotification,
  getStudentAndParentRecipients,
} from "@/src/services/notificationsCenterApi";

const COLLECTION_NAME = "Attendance";

const VALID_STATUSES: AttendanceStatus[] = ["present", "absent", "late"];

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

const attendanceConverter = (
  docSnap: QueryDocumentSnapshot<DocumentData>
): Attendance => {
  const data = docSnap.data();
  const status: AttendanceStatus = VALID_STATUSES.includes(data.status)
    ? data.status
    : "absent";

  return {
    id: docSnap.id,
    studentId: data.studentId ?? "",
    courseId: data.courseId ?? "",
    lessonId: data.lessonId ?? "",
    date: parseDate(data.date),
    status,
    note: data.note ?? "",
  };
};

export async function getAttendanceByStudent(
  studentId: string
): Promise<Attendance[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("studentId", "==", studentId)
    );

    const snapshot = await getDocs(q);
    const records = snapshot.docs.map((doc) =>
      attendanceConverter(doc as QueryDocumentSnapshot<DocumentData>)
    );

    // Najnowsze najpierw
    records.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    return records;
  } catch (error) {
    console.error("Błąd podczas pobierania obecności:", error);
    throw new Error("Nie udało się pobrać obecności.");
  }
}

export interface AttendanceSection {
  title: string;
  data: Attendance[];
}

export async function getAttendanceByLesson(
  lessonId: string
): Promise<Attendance[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("lessonId", "==", lessonId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) =>
      attendanceConverter(d as QueryDocumentSnapshot<DocumentData>)
    );
  } catch (error) {
    console.error("Błąd podczas pobierania frekwencji lekcji:", error);
    return [];
  }
}

export interface AttendanceUpsertInput {
  studentId: string;
  courseId: string;
  lessonId: string;
  date: string;
  status: AttendanceStatus;
  note?: string;
}

/**
 * Zapisuje pojedynczy rekord frekwencji.
 * Deterministyczne id `{lessonId}_{studentId}` zapewnia jeden rekord per
 * (lekcja, uczeń) — kolejne wywołania nadpisują.
 */
export async function upsertAttendance(
  input: AttendanceUpsertInput
): Promise<void> {
  const id = `${input.lessonId}_${input.studentId}`;
  try {
    await setDoc(
      doc(db, COLLECTION_NAME, id),
      {
        studentId: input.studentId,
        courseId: input.courseId,
        lessonId: input.lessonId,
        date: input.date,
        status: input.status,
        note: input.note ?? "",
      },
      { merge: true }
    );
    const recipients = await getStudentAndParentRecipients([input.studentId]);
    const statusLabel =
      input.status === "present"
        ? "obecny"
        : input.status === "late"
          ? "spóźniony"
          : "nieobecny";
    await createAppNotification({
      type: "attendance_updated",
      title: "Zaktualizowano frekwencję",
      body: `Status obecności: ${statusLabel}.`,
      targetUserIds: recipients,
      relatedPath: "/student/presence",
      relatedId: input.lessonId,
    });
  } catch (error) {
    console.error("Błąd podczas zapisu frekwencji:", error);
    throw new Error("Nie udało się zapisać frekwencji.");
  }
}

/** Grupuje rekordy po courseId (przedmiocie) na potrzeby SectionList. */
export function groupAttendanceByCourse(
  records: Attendance[]
): AttendanceSection[] {
  const map = new Map<string, Attendance[]>();

  for (const record of records) {
    const key = record.courseId || "Bez przedmiotu";
    const bucket = map.get(key);
    if (bucket) {
      bucket.push(record);
    } else {
      map.set(key, [record]);
    }
  }

  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}
