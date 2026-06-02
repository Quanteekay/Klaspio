export default interface Task {
  id: string;
  title: string;
  userId: string;
  subjectId: string;
  groupId?: string;
  teacherId: string;
  teacherName?: string;
  rate: number | null;
  comment: string;
  commited: boolean;
  taskContent: string;
  answerContent: string;
  date?: string;
  submittedAt?: string;
}
