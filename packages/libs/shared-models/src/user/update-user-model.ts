import { UserRole } from "../enums/user-role-enum";
import { UserIdRequestModel } from "./userid-request-model";

export class UpdateUserModel extends UserIdRequestModel {
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
        userId: string,
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
        super(userId);
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
