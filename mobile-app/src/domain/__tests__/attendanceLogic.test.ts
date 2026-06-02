import { getAttendanceStats } from "@/src/domain/attendanceLogic";
import type Attendance from "@/src/models/Attendance";

function record(status: Attendance["status"]): Attendance {
  return {
    id: status,
    studentId: "s1",
    courseId: "c1",
    lessonId: "l1",
    date: "2026-06-01T10:00:00.000Z",
    status,
  };
}

describe("attendanceLogic", () => {
  it("handles empty records", () => {
    expect(getAttendanceStats([])).toEqual({
      total: 0,
      present: 0,
      late: 0,
      absent: 0,
      attendedPercent: 0,
    });
  });

  it("counts attendance and treats late as attended", () => {
    expect(
      getAttendanceStats([
        record("present"),
        record("late"),
        record("absent"),
        record("present"),
      ])
    ).toEqual({
      total: 4,
      present: 2,
      late: 1,
      absent: 1,
      attendedPercent: 75,
    });
  });
});
