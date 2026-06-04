import { SystemRoles } from '../models/roles';

export interface RegisterDTO {
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  password?: string; // Optional if we plan to separate DTO creation and request Body (password is hashed)
  phone?: string;
  role?: SystemRoles;
  department?: string;
  designation?: string;
}

export interface LoginDTO {
  email: string;
}

export interface UserUpdateDTO {
  firstName?: string;
  lastName?: string;
  phone?: string;
  department?: string;
  designation?: string;
  isActive?: boolean;
  role?: SystemRoles;
}
