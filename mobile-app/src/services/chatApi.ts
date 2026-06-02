import { db } from "@/FirebaseConfig";
import {
  addDoc,
  collection,
  DocumentData,
  onSnapshot,
  orderBy,
  query,
  QueryDocumentSnapshot,
  serverTimestamp,
  Timestamp,
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
    where("conversationId", "==", conversationId),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(
    q,
    (snap) =>
      onMessages(
        snap.docs.map((d) =>
          messageConverter(d as QueryDocumentSnapshot<DocumentData>)
        )
      ),
    (error) => {
      console.error("Błąd realtime czatu:", error);
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
    createdAt: serverTimestamp(),
  });
}
