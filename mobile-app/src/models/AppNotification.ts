export type NotificationType =
  | "task_created"
  | "grade_added"
  | "attendance_updated"
  | "lesson_created"
  | "lesson_updated"
  | "admin_message";

export default interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  targetUserIds: string[];
  readBy: string[];
  createdBy?: string;
  createdAt?: string;
  relatedPath?: string;
  relatedId?: string;
}
