import { db } from "@/FirebaseConfig";
import {
  addDoc,
  arrayUnion,
  collection,
  DocumentData,
  doc,
  onSnapshot,
  query,
  QueryDocumentSnapshot,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import type ChatMessage from "@/src/models/ChatMessage";

const COLLECTION_NAME = "Messages";

export function conversationIdFor(a: string, b: string): string {
  return [a, b].sort().join("_");
}

function parseDate(raw: unknown): string {
  if (raw instanceof Timestamp) return raw.toDate().toISOString();
  if (typeof raw === "string") return raw;
  if (raw && typeof (raw as { toDate?: () => Date }).toDate === "function") {
    return (raw as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
}

function messageConverter(d: QueryDocumentSnapshot<DocumentData>): ChatMessage {
  const data = d.data();
  return {
    id: d.id,
    conversationId: data.conversationId ?? "",
    participantIds: Array.isArray(data.participantIds) ? data.participantIds : [],
    senderId: data.senderId ?? "",
    receiverId: data.receiverId ?? "",
    body: data.body ?? "",
    createdAt: parseDate(data.createdAt),
    readBy: Array.isArray(data.readBy) ? data.readBy : [],
  };
}

export function subscribeToConversation(
  currentUserId: string,
  otherUserId: string,
  onMessages: (messages: ChatMessage[]) => void,
  onError?: (message: string) => void
) {
  const conversationId = conversationIdFor(currentUserId, otherUserId);
  const q = query(
    collection(db, COLLECTION_NAME),
    where("conversationId", "==", conversationId)
  );
  return onSnapshot(
    q,
    (snap) =>
      onMessages(
        snap.docs
          .map((d) => messageConverter(d as QueryDocumentSnapshot<DocumentData>))
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      ),
    (error) => {
      console.warn("Błąd realtime czatu:", error);
      onError?.("Nie udało się pobrać wiadomości.");
    }
  );
}

export async function sendMessage(
  currentUserId: string,
  otherUserId: string,
  body: string
): Promise<void> {
  const trimmed = body.trim();
  if (!trimmed) return;
  await addDoc(collection(db, COLLECTION_NAME), {
    conversationId: conversationIdFor(currentUserId, otherUserId),
    participantIds: [currentUserId, otherUserId],
    senderId: currentUserId,
    receiverId: otherUserId,
    body: trimmed,
    readBy: [currentUserId],
    createdAt: serverTimestamp(),
  });
}

export function subscribeToUnreadMessageCount(
  currentUserId: string,
  onCount: (count: number) => void
) {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("participantIds", "array-contains", currentUserId)
  );

  return onSnapshot(
    q,
    (snap) => {
      const count = snap.docs
        .map((d) => messageConverter(d as QueryDocumentSnapshot<DocumentData>))
        .filter(
          (message) =>
            message.senderId !== currentUserId &&
            !message.readBy.includes(currentUserId)
        ).length;
      onCount(count);
    },
    (error) => {
      console.warn("Błąd licznika wiadomości:", error);
      onCount(0);
    }
  );
}

export function subscribeToUserMessages(
  currentUserId: string,
  onMessages: (messages: ChatMessage[]) => void,
  onError?: (message: string) => void
) {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("participantIds", "array-contains", currentUserId)
  );

  return onSnapshot(
    q,
    (snap) =>
      onMessages(
        snap.docs
          .map((d) => messageConverter(d as QueryDocumentSnapshot<DocumentData>))
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
      ),
    (error) => {
      console.warn("Błąd pobierania rozmów:", error);
      onError?.("Nie udało się pobrać rozmów.");
    }
  );
}

export function subscribeToUnreadMessageCountsByUser(
  currentUserId: string,
  onCounts: (counts: Record<string, number>) => void
) {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("participantIds", "array-contains", currentUserId)
  );

  return onSnapshot(
    q,
    (snap) => {
      const counts: Record<string, number> = {};
      snap.docs
        .map((d) => messageConverter(d as QueryDocumentSnapshot<DocumentData>))
        .filter(
          (message) =>
            message.senderId !== currentUserId &&
            !message.readBy.includes(currentUserId)
        )
        .forEach((message) => {
          counts[message.senderId] = (counts[message.senderId] ?? 0) + 1;
        });
      onCounts(counts);
    },
    (error) => {
      console.warn("Błąd liczników rozmów:", error);
      onCounts({});
    }
  );
}

export async function markConversationRead(
  currentUserId: string,
  otherUserId: string,
  messages: ChatMessage[]
): Promise<void> {
  const conversationId = conversationIdFor(currentUserId, otherUserId);
  await Promise.all(
    messages
      .filter(
        (message) =>
          message.conversationId === conversationId &&
          message.senderId !== currentUserId &&
          !message.readBy.includes(currentUserId)
      )
      .map((message) =>
        updateDoc(doc(db, COLLECTION_NAME, message.id), {
          readBy: arrayUnion(currentUserId),
        })
      )
  );
}
