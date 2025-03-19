import { UserRole } from "../enums/user-role-enum";

export class CreateUserModel {
    username: string;
    email: string;
    password: string;
    profilePicture: string;
    role?: UserRole;
    constructor(
      username: string,
      email: string,
      password: string,
      profilePicture: string = '',
      role?: UserRole
    ) {
      this.username = username;
      this.email = email;
      this.password = password;
      this.profilePicture = profilePicture;
      this.role = role
    }
  }
  