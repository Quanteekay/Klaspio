import type Task from "@/src/models/Task";
import type Subject from "@/src/models/Subject";

export const NO_SUBJECT_ID = "__no_subject__";

export interface SubjectAverage {
  subjectId: string;
  subjectName: string;
  average: number | null;
  count: number;
  includedInOverall: boolean;
}

export interface GradesAverages {
  overallAverage: number | null;
  subjects: SubjectAverage[];
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}

export function computeGradesAverages(
  tasks: Task[],
  subjects: Subject[]
): GradesAverages {
  const names = new Map(subjects.map((subject) => [subject.id, subject.name]));
  const buckets = new Map<string, number[]>();
  const overallRates: number[] = [];

  for (const task of tasks) {
    if (!task.commited || task.rate === null) continue;
    const subjectId = task.subjectId || NO_SUBJECT_ID;
    const bucket = buckets.get(subjectId) ?? [];
    bucket.push(task.rate);
    buckets.set(subjectId, bucket);
    if (subjectId !== NO_SUBJECT_ID) overallRates.push(task.rate);
  }

  const subjectAverages = Array.from(buckets.entries()).map(
    ([subjectId, rates]) => ({
      subjectId,
      subjectName:
        subjectId === NO_SUBJECT_ID
          ? "Bez przedmiotu"
          : names.get(subjectId) ?? "Nieznany przedmiot",
      average: rates.length
        ? roundOne(rates.reduce((sum, rate) => sum + rate, 0) / rates.length)
        : null,
      count: rates.length,
      includedInOverall: subjectId !== NO_SUBJECT_ID,
    })
  );

  subjectAverages.sort((a, b) =>
    a.subjectName.localeCompare(b.subjectName, "pl", { sensitivity: "base" })
  );

  return {
    overallAverage: overallRates.length
      ? roundOne(
          overallRates.reduce((sum, rate) => sum + rate, 0) /
            overallRates.length
        )
      : null,
    subjects: subjectAverages,
  };
}

export function formatAverage(value: number | null): string {
  return value === null ? "—" : value.toFixed(1);
}
