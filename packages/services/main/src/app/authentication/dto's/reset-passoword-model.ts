import { IsEmail, IsNotEmpty, Length, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsNotEmpty({ message: 'OTP is required' })
  @Length(4, 8, { message: 'OTP must be between 4 and 8 characters' })
  otp: string;

  @IsNotEmpty({ message: 'New password is required' })
  @Matches(/^(?=(.*[a-z]){2,})(?=(.*[A-Z]){1,})(?=(.*\d){1,})(?=(.*[@$!%*?&\#_\-\+\/]){2,})[A-Za-z\d@$!%*?&\#_\-\+\/]{8,}$/, {
    message: 'Password must be at least 8 characters long, with at least 1 uppercase letters and 1 special characters (@, $, !, %, *, ?, &, #, _, -, +, /)',
  })
  newPassword: string;
}
