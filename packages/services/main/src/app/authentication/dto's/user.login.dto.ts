import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class UserLoginModel {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
