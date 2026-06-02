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
  updateDoc,
} from "firebase/firestore";
import type Subject from "@/src/models/Subject";

const COLLECTION_NAME = "Subjects";

function subjectConverter(d: QueryDocumentSnapshot<DocumentData>): Subject {
  const data = d.data();
  return {
    id: d.id,
    name: data.name ?? "",
    description: data.description ?? "",
    active: data.active ?? true,
  };
}

function sortSubjects(subjects: Subject[]): Subject[] {
  return subjects.sort((a, b) =>
    a.name.localeCompare(b.name, "pl", { sensitivity: "base" })
  );
}

export type SubjectInput = Omit<Subject, "id">;

export async function getAllSubjects(): Promise<Subject[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTION_NAME));
    return sortSubjects(
      snap.docs.map((d) =>
        subjectConverter(d as QueryDocumentSnapshot<DocumentData>)
      )
    );
  } catch (error) {
    console.error("Błąd podczas pobierania przedmiotów:", error);
    return [];
  }
}

export async function getSubjectById(id: string): Promise<Subject | null> {
  try {
    const snap = await getDoc(doc(db, COLLECTION_NAME, id));
    if (!snap.exists()) return null;
    return subjectConverter(snap as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    console.error("Błąd podczas pobierania przedmiotu:", error);
    return null;
  }
}

export async function createSubject(input: SubjectInput): Promise<void> {
  try {
    await addDoc(collection(db, COLLECTION_NAME), {
      name: input.name.trim(),
      description: input.description?.trim() ?? "",
      active: input.active,
    });
  } catch (error) {
    console.error("Błąd podczas tworzenia przedmiotu:", error);
    throw new Error("Nie udało się utworzyć przedmiotu.");
  }
}

export async function updateSubject(
  id: string,
  input: Partial<SubjectInput>
): Promise<void> {
  try {
    const payload: DocumentData = {};
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) {
        payload[key] = typeof value === "string" ? value.trim() : value;
      }
    }
    await updateDoc(doc(db, COLLECTION_NAME, id), payload);
  } catch (error) {
    console.error("Błąd podczas aktualizacji przedmiotu:", error);
    throw new Error("Nie udało się zaktualizować przedmiotu.");
  }
}

export async function deleteSubject(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error("Błąd podczas usuwania przedmiotu:", error);
    throw new Error("Nie udało się usunąć przedmiotu.");
  }
}
