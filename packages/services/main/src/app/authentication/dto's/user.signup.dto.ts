import { UserRole } from "@in-one/shared-models";
import { IsEmail, IsNotEmpty, IsString, IsOptional } from "class-validator";

export class CreateUserModel {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsString()
  profilePicture?: string;

  @IsOptional()
  role?: UserRole;
}
