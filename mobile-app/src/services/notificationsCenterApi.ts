import { db } from "@/FirebaseConfig";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  DocumentData,
  getDocs,
  onSnapshot,
  query,
  QueryDocumentSnapshot,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import type AppNotification from "@/src/models/AppNotification";
import type { NotificationType } from "@/src/models/AppNotification";

const COLLECTION_NAME = "Notifications";

function parseDate(raw: unknown): string | undefined {
  if (raw instanceof Timestamp) return raw.toDate().toISOString();
  if (typeof raw === "string") return raw;
  if (raw && typeof (raw as { toDate?: () => Date }).toDate === "function") {
    return (raw as { toDate: () => Date }).toDate().toISOString();
  }
  return undefined;
}

function notificationConverter(
  d: QueryDocumentSnapshot<DocumentData>
): AppNotification {
  const data = d.data();
  return {
    id: d.id,
    type: data.type ?? "lesson_updated",
    title: data.title ?? "",
    body: data.body ?? "",
    targetUserIds: Array.isArray(data.targetUserIds) ? data.targetUserIds : [],
    readBy: Array.isArray(data.readBy) ? data.readBy : [],
    createdBy: data.createdBy ?? "",
    createdAt: parseDate(data.createdAt),
    relatedPath: data.relatedPath ?? undefined,
    relatedId: data.relatedId ?? undefined,
  };
}

function getNotificationTime(notification: AppNotification): number {
  if (!notification.createdAt) return 0;
  const time = new Date(notification.createdAt).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export interface NotificationInput {
  type: NotificationType;
  title: string;
  body: string;
  targetUserIds: string[];
  createdBy?: string;
  relatedPath?: string;
  relatedId?: string;
}

function uniqueIds(ids: string[]): string[] {
  return Array.from(new Set(ids.filter(Boolean)));
}

export async function createAppNotification(
  input: NotificationInput
): Promise<void> {
  const targetUserIds = uniqueIds(input.targetUserIds);
  if (targetUserIds.length === 0) return;

  await addDoc(collection(db, COLLECTION_NAME), {
    type: input.type,
    title: input.title.trim(),
    body: input.body.trim(),
    targetUserIds,
    readBy: [],
    createdBy: input.createdBy ?? "",
    relatedPath: input.relatedPath ?? "",
    relatedId: input.relatedId ?? "",
    createdAt: serverTimestamp(),
  });
}

export async function getNotificationsForUser(
  userId: string
): Promise<AppNotification[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("targetUserIds", "array-contains", userId)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => notificationConverter(d as QueryDocumentSnapshot<DocumentData>))
      .sort((a, b) => getNotificationTime(b) - getNotificationTime(a));
  } catch (error) {
    console.error("Błąd podczas pobierania alertów:", error);
    return [];
  }
}

export function subscribeToUnreadNotificationCount(
  userId: string,
  onCount: (count: number) => void
) {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("targetUserIds", "array-contains", userId)
  );

  return onSnapshot(
    q,
    (snap) => {
      const count = snap.docs
        .map((d) => notificationConverter(d as QueryDocumentSnapshot<DocumentData>))
        .filter((item) => !item.readBy.includes(userId)).length;
      onCount(count);
    },
    (error) => {
      console.error("Błąd licznika alertów:", error);
      onCount(0);
    }
  );
}

export async function markNotificationRead(
  notificationId: string,
  userId: string
): Promise<void> {
  await updateDoc(doc(db, COLLECTION_NAME, notificationId), {
    readBy: arrayUnion(userId),
  });
}

export async function markAllNotificationsRead(
  notifications: AppNotification[],
  userId: string
): Promise<void> {
  await Promise.all(
    notifications
      .filter((item) => !item.readBy.includes(userId))
      .map((item) => markNotificationRead(item.id, userId))
  );
}

export async function getParentIdsForStudent(
  studentId: string
): Promise<string[]> {
  try {
    const snap = await getDocs(
      query(collection(db, "users"), where("children", "array-contains", studentId))
    );
    return snap.docs.map((parentDoc) => parentDoc.id);
  } catch (error) {
    console.error("Błąd podczas pobierania rodziców ucznia:", error);
    return [];
  }
}

export async function getStudentAndParentRecipients(
  studentIds: string[]
): Promise<string[]> {
  const parentGroups = await Promise.all(
    uniqueIds(studentIds).map((studentId) => getParentIdsForStudent(studentId))
  );
  return uniqueIds([...studentIds, ...parentGroups.flat()]);
}
