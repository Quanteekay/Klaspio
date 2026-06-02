import { computeGradesAverages, NO_SUBJECT_ID } from "@/src/domain/gradesLogic";
import type Task from "@/src/models/Task";
import type Subject from "@/src/models/Subject";

const subjects: Subject[] = [
  { id: "eng", name: "Angielski", active: true },
  { id: "de", name: "Niemiecki", active: true },
];

function task(partial: Partial<Task>): Task {
  return {
    id: partial.id ?? "t",
    title: partial.title ?? "Task",
    userId: "s1",
    subjectId: partial.subjectId ?? "eng",
    teacherId: "t1",
    rate: partial.rate ?? null,
    comment: "",
    commited: partial.commited ?? true,
    taskContent: "",
    answerContent: "",
  };
}

describe("gradesLogic", () => {
  it("returns null overall and no subjects when there are no graded tasks", () => {
    expect(computeGradesAverages([task({ rate: null })], subjects)).toEqual({
      overallAverage: null,
      subjects: [],
    });
  });

  it("computes average for one subject", () => {
    const result = computeGradesAverages(
      [task({ rate: 80 }), task({ rate: 90 })],
      subjects
    );
    expect(result.overallAverage).toBe(85);
    expect(result.subjects[0]).toMatchObject({
      subjectId: "eng",
      subjectName: "Angielski",
      average: 85,
      count: 2,
    });
  });

  it("groups multiple subjects and ignores uncommitted tasks", () => {
    const result = computeGradesAverages(
      [
        task({ rate: 70, subjectId: "eng" }),
        task({ rate: 100, subjectId: "de" }),
        task({ rate: 20, subjectId: "de", commited: false }),
      ],
      subjects
    );
    expect(result.overallAverage).toBe(85);
    expect(result.subjects).toHaveLength(2);
  });

  it("shows no-subject tasks separately and excludes them from overall", () => {
    const result = computeGradesAverages(
      [task({ rate: 80, subjectId: "" }), task({ rate: 100, subjectId: "eng" })],
      subjects
    );
    expect(result.overallAverage).toBe(100);
    expect(result.subjects.find((item) => item.subjectId === NO_SUBJECT_ID))
      .toMatchObject({
        subjectName: "Bez przedmiotu",
        average: 80,
        includedInOverall: false,
      });
  });
});
