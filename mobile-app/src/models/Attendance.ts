export type AttendanceStatus = "present" | "absent" | "late";

export default interface Attendance {
  id: string;
  studentId: string;
  courseId: string;
  lessonId: string;
  date: string;
  status: AttendanceStatus;
  note?: string;
}
