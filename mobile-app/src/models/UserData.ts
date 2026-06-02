import { UserRole } from "./UserRole";

export default interface UserData {
  firstName: string;
  surname: string;
  role: UserRole;
  email: string;
  uid: string;
  active: boolean;
  avatar?: string;
  children?: string[];
  pushTokens?: string[];
}
