import type Task from "@/src/models/Task";
import type Subject from "@/src/models/Subject";
import { getTasksByStudent } from "@/src/services/studentApi";
import { getAllSubjects } from "@/src/services/subjectsApi";
export type { GradesAverages, SubjectAverage } from "@/src/domain/gradesLogic";
export {
  computeGradesAverages,
  formatAverage,
  NO_SUBJECT_ID,
} from "@/src/domain/gradesLogic";
import { computeGradesAverages } from "@/src/domain/gradesLogic";

/**
 * Liczymy średnią ogólną jako średnią wszystkich ocenionych i zatwierdzonych
 * zadań ucznia. Zadania bez subjectId pokazujemy osobno jako "Bez przedmiotu"
 * i nie wliczamy ich do średniej ogólnej, bo nie da się ich przypisać do
 * konkretnego obszaru nauki.
 */
export async function getGradesAveragesForStudent(
  studentId: string
): Promise<import("@/src/domain/gradesLogic").GradesAverages> {
  const [tasks, subjects] = await Promise.all([
    getTasksByStudent(studentId),
    getAllSubjects(),
  ]);
  return computeGradesAverages(tasks, subjects);
}
