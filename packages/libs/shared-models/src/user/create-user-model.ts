import { UserRole } from "../enums/user-role-enum";

export class CreateUserModel {
  username: string;
  email: string;
  password: string;
  profilePicture?: string;
  role?: UserRole;
  bio?: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: Date;

  constructor(
    username: string,
    email: string,
    password: string,
    profilePicture?: string,
    role?: UserRole,
    bio?: string,
    phoneNumber?: string,
    address?: string,
    dateOfBirth?: Date
  ) {
    this.username = username;
    this.email = email;
    this.password = password;
    this.profilePicture = profilePicture;
    this.role = role;
    this.bio = bio;
    this.phoneNumber = phoneNumber;
    this.address = address;
    this.dateOfBirth = dateOfBirth
  }
}
