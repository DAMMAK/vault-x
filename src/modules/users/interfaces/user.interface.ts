export interface IUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  organization?: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}
