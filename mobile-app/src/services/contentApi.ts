import { db } from "@/FirebaseConfig";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getDocs,
  query,
  QueryDocumentSnapshot,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import type ContentItem from "@/src/models/ContentItem";
import type { UserRole } from "@/src/models/UserRole";

const COLLECTION_NAME = "ContentItems";

function parseDate(raw: unknown): string | undefined {
  if (raw instanceof Timestamp) return raw.toDate().toISOString();
  if (typeof raw === "string") return raw;
  if (raw && typeof (raw as { toDate?: () => Date }).toDate === "function") {
    return (raw as { toDate: () => Date }).toDate().toISOString();
  }
  return undefined;
}

function contentConverter(d: QueryDocumentSnapshot<DocumentData>): ContentItem {
  const data = d.data();
  return {
    id: d.id,
    kind: data.kind === "gallery" ? "gallery" : "material",
    title: data.title ?? "",
    description: data.description ?? "",
    url: data.url ?? "",
    fileType: data.fileType ?? "link",
    subjectId: data.subjectId ?? undefined,
    visibleFor: Array.isArray(data.visibleFor) ? data.visibleFor : ["student", "parent"],
    active: data.active ?? true,
    createdBy: data.createdBy ?? "",
    createdAt: parseDate(data.createdAt),
  };
}

export type ContentInput = Omit<ContentItem, "id" | "createdAt">;

export async function getContentForRole(role: UserRole): Promise<ContentItem[]> {
  try {
    const snap = await getDocs(
      query(
        collection(db, COLLECTION_NAME),
        where("active", "==", true),
        where("visibleFor", "array-contains", role)
      )
    );
    return snap.docs
      .map((d) => contentConverter(d as QueryDocumentSnapshot<DocumentData>))
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  } catch (error) {
    console.error("Błąd podczas pobierania materiałów:", error);
    return [];
  }
}

export async function getAllContent(): Promise<ContentItem[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTION_NAME));
    return snap.docs
      .map((d) => contentConverter(d as QueryDocumentSnapshot<DocumentData>))
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  } catch (error) {
    console.error("Błąd podczas pobierania treści:", error);
    return [];
  }
}

export async function createContentItem(input: ContentInput): Promise<void> {
  await addDoc(collection(db, COLLECTION_NAME), {
    ...input,
    title: input.title.trim(),
    description: input.description?.trim() ?? "",
    url: input.url.trim(),
    createdAt: serverTimestamp(),
  });
}

export async function updateContentItem(
  id: string,
  input: Partial<ContentInput>
): Promise<void> {
  const payload: DocumentData = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      payload[key] = typeof value === "string" ? value.trim() : value;
    }
  }
  await updateDoc(doc(db, COLLECTION_NAME, id), payload);
}

export async function deleteContentItem(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION_NAME, id));
}
