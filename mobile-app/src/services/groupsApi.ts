import { db } from "@/FirebaseConfig";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  QueryDocumentSnapshot,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import type Group from "@/src/models/Group";

const COLLECTION_NAME = "Groups";

function parseCreatedAt(raw: unknown): string | undefined {
  if (raw instanceof Timestamp) return raw.toDate().toISOString();
  if (typeof raw === "string") return raw;
  if (raw && typeof (raw as { toDate?: () => Date }).toDate === "function") {
    return (raw as { toDate: () => Date }).toDate().toISOString();
  }
  return undefined;
}

function groupConverter(d: QueryDocumentSnapshot<DocumentData>): Group {
  const data = d.data();
  return {
    id: d.id,
    name: data.name ?? "",
    description: data.description ?? "",
    memberIds: Array.isArray(data.memberIds) ? data.memberIds : [],
    createdBy: data.createdBy ?? "",
    createdAt: parseCreatedAt(data.createdAt),
  };
}

export async function getAllGroups(): Promise<Group[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTION_NAME));
    return snap.docs.map((d) =>
      groupConverter(d as QueryDocumentSnapshot<DocumentData>)
    );
  } catch (error) {
    console.error("Błąd podczas pobierania grup:", error);
    return [];
  }
}

export async function getGroupById(id: string): Promise<Group | null> {
  try {
    const ref = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return groupConverter(snap as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    console.error("Błąd podczas pobierania grupy:", error);
    return null;
  }
}

export type GroupInput = Omit<Group, "id" | "createdAt">;

export async function createGroup(input: GroupInput): Promise<void> {
  try {
    await addDoc(collection(db, COLLECTION_NAME), {
      name: input.name,
      description: input.description ?? "",
      memberIds: input.memberIds,
      createdBy: input.createdBy ?? "",
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Błąd podczas tworzenia grupy:", error);
    throw new Error("Nie udało się utworzyć grupy.");
  }
}

export async function updateGroup(
  id: string,
  partial: Partial<GroupInput>
): Promise<void> {
  try {
    const ref = doc(db, COLLECTION_NAME, id);
    const payload: DocumentData = {};
    for (const [k, v] of Object.entries(partial)) {
      if (v !== undefined) payload[k] = v;
    }
    await updateDoc(ref, payload);
  } catch (error) {
    console.error("Błąd podczas aktualizacji grupy:", error);
    throw new Error("Nie udało się zaktualizować grupy.");
  }
}

export async function deleteGroup(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error("Błąd podczas usuwania grupy:", error);
    throw new Error("Nie udało się usunąć grupy.");
  }
}
