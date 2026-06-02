export default interface Lesson {
  id: string;
  courseId: string;
  subjectId: string;
  groupId?: string;
  teacherId: string;
  studentIds: string[];
  date: string;
  durationMin: number;
  topic: string;
  summary?: string;
  materials?: string[];
  location: string;
  online?: boolean;
  meetingUrl?: string;
}
