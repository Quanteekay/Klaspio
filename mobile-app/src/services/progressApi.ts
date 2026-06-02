import { getAttendanceByStudent, getAttendanceStats } from "@/src/services/attendanceApi";
import { getGradesAveragesForStudent } from "@/src/services/gradesApi";

export interface StudentProgressStats {
  overallAverage: number | null;
  subjectCount: number;
  attendedPercent: number;
  attendanceTotal: number;
}

export async function getStudentProgressStats(
  studentId: string
): Promise<StudentProgressStats> {
  const [averages, attendance] = await Promise.all([
    getGradesAveragesForStudent(studentId),
    getAttendanceByStudent(studentId),
  ]);
  const attendanceStats = getAttendanceStats(attendance);
  return {
    overallAverage: averages.overallAverage,
    subjectCount: averages.subjects.filter((item) => item.includedInOverall).length,
    attendedPercent: attendanceStats.attendedPercent,
    attendanceTotal: attendanceStats.total,
  };
}
