export type ContentKind = "material" | "gallery";
export type ContentFileType = "link" | "pdf" | "video" | "image";

export default interface ContentItem {
  id: string;
  kind: ContentKind;
  title: string;
  description?: string;
  url: string;
  fileType: ContentFileType;
  subjectId?: string;
  visibleFor: Array<"student" | "parent" | "teacher" | "admin">;
  active: boolean;
  createdBy?: string;
  createdAt?: string;
}
