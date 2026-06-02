export default interface Group {
  id: string;
  name: string;
  description?: string;
  memberIds: string[];
  createdBy?: string;
  createdAt?: string;
}
