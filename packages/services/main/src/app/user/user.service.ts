import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import * as CryptoJS from 'crypto-js';
import { CommonResponse, CreateUserModel, EmailRequestModel, ResetPassowordModel, UserIdRequestModel, UserLoginModel, UserRole, WelcomeRequestModel, UpdateUserModel } from '@in-one/shared-models';
import { UserRepository } from './repository/user.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { GenericTransactionManager } from 'src/database/trasanction-manager';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserRepository)
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) { }

  async createUser(reqModel: CreateUserModel): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const passwordRegex = /^(?=(.*[a-z]){2,})(?=(.*[A-Z]){1,})(?=(.*\d){1,})(?=(.*[@$!%*?&#_+\-/]){2,})[A-Za-z\d@$!%*?&#_+\-/]{8,}$/;
      if (!passwordRegex.test(reqModel.password)) {
        throw new Error(
          'Password must be at least 8 characters long, with at least 2 lowercase letters, 1 uppercase letter, 1 number, and 2 special characters (@, $, !, %, *, ?, &, #, _, -, +, /)',
        );
      }

      const existingUser = await this.userRepository.findOne({
        where: [{ username: reqModel.username }, { email: reqModel.email }],
      });
      if (existingUser) {
        throw new Error('Username or email already exists');
      }

      await transactionManager.startTransaction();

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(reqModel.password, saltRounds);

      const verificationToken = CryptoJS.lib.WordArray.random(32).toString();

      const user = this.userRepository.create({
        username: reqModel.username,
        email: reqModel.email,
        password: hashedPassword,
        profilePicture: reqModel.profilePicture,
        status: 'offline',
        role: UserRole.USER,
        bio: reqModel.bio,
        phoneNumber: reqModel.phoneNumber,
        address: reqModel.address,
        dateOfBirth: reqModel.dateOfBirth,
        verificationToken,
        isEmailVerified: false,
      });

      const savedUser = await transactionManager.getRepository(UserEntity).save(user);
      await transactionManager.commitTransaction();

      try {
        await this.sendWelcomeEmail({ email: reqModel.email, username: reqModel.username });
        await this.sendVerificationEmail({ email: reqModel.email, verificationToken });
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
      }

      const { password, verificationToken: token, ...userResponse } = savedUser;
      return new CommonResponse(true, 201, 'User created successfully', userResponse);
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      return new CommonResponse(false, message.includes('required') ? 400 : 500, message, null);
    }
  }

  async sendWelcomeEmail(reqModel: WelcomeRequestModel): Promise<void> {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: reqModel.email,
        subject: 'Welcome to Our Platform!',
        html: `
            <!DOCTYPE html>
            <html>
              <body style="margin: 0; padding: 0; background-color: #ffffff;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; padding: 20px 0;">
                  <tr>
                    <td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 10px; overflow: hidden;">
                        <tr>
                          <td style="padding: 20px; text-align: center;">
                            <table align="center" style="margin: 0 auto;">
                              <tr>
                                <td style="vertical-align: middle;">
                                  <h1 style="margin: 0; font-size: 28px; color: #000000; font-family: Arial, sans-serif; display: inline-block;">
                                    Welcome to
                                  </h1>
                                </td>
                                <td style="padding-left: 10px; vertical-align: middle;">
                                  <div style="display: inline-flex; align-items: center; gap: 6px;">
                                    <div style="width: 40px; height: 40px; background-color: #8a2be2; color: #fff; font-weight: bold; font-size: 18px; font-family: Arial, sans-serif; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                      IN
                                    </div>
                                    <span style="font-size: 20px; color: #8a2be2; font-weight: bold; font-family: Arial, sans-serif;">
                                      One
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="text-align: center;">
                            <h2 style="font-size: 22px; margin: 0 0 20px; color: #333333; font-family: Arial, sans-serif;">
                              Hello, ${reqModel.username}!
                            </h2>
                            <p style="font-size: 16px; color: #555555; margin: 10px 0 30px; font-family: Arial, sans-serif;">
                              We're thrilled to have you with us.<br>
                              Please verify your email to unlock all features.
                            </p>
                            <a href="https://in-one.com" style="background-color: #8a2be2; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-size: 16px; font-family: Arial, sans-serif;">
                              Get Started
                            </a>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 20px 30px; text-align: center;">
                            <p style="font-size: 16px; color: #888888; margin: 0; font-family: Arial, sans-serif;">
                              Best Regards,<br><strong>In-One Team</strong>
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 30px; text-align: center; font-size: 12px; color: #aaaaaa; font-family: Arial, sans-serif;">
                            © 2025 In-One. All rights reserved.
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
          `,
      };
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending welcome email:', error);
    }
  }

  async sendVerificationEmail(reqModel: { email: string; verificationToken: string }): Promise<void> {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });

      const verificationLink = `https://in-one.com/verify-email?token=${reqModel.verificationToken}`;
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: reqModel.email,
        subject: 'Verify Your Email Address',
        html: `<!DOCTYPE html>
               <html>
                 <body style="margin: 0; padding: 0; background-color: #ffffff;">
                   <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; padding: 20px 0;">
                     <tr>
                       <td align="center">
                         <table width="600" style="background-color: #ffffff; border-radius: 10px; overflow: hidden;">
                           <tr>
                             <td style="text-align: center">
                               <h1 style="margin: 0; font-size: 30px; color: #ffffff; font-family: Arial, sans-serif;"> Verify Your Email </h1>
                             </td>
                           </tr>
                           <tr>
                             <td style="padding: 30px 30px; text-align: center;">
                               <p style="font-size: 16px; color: #555555; margin: 10px 0 30px; font-family: Arial, sans-serif;">
                                 Please click the button below to verify your email address.
                               </p>
                               <a href="${verificationLink}" style="background-color: #8a2be2; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-size: 16px; font-family: Arial, sans-serif;">
                                 Verify Email
                               </a>
                               <p style="font-size: 14px; color: #888888; margin-top: 20px; font-family: Arial, sans-serif;">
                                 This link will expire in 24 hours.
                               </p>
                             </td>
                           </tr>
                           <tr>
                             <td style="padding: 20px 30px; text-align: center;">
                               <p style="font-size: 16px; color: #888888; margin: 0; font-family: Arial, sans-serif;">
                                 Best Regards,<br><strong>In-One Team</strong>
                               </p>
                             </td>
                           </tr>
                           <tr>
                             <td style="padding: 10px 30px; text-align: center; font-size: 12px; color: #aaaaaa; font-family: Arial, sans-serif;">
                               © 2025 In-One. All rights reserved.
                             </td>
                           </tr>
                         </table>
                       </td>
                     </tr>
                   </table>
                 </body>
               </html>`,
      };
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending verification email:', error);
    }
  }

  async verifyEmail(token: string): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const user = await this.userRepository.findOne({ where: { verificationToken: token } });
      if (!user) {
        throw new Error('Invalid or expired verification token');
      }

      await transactionManager.startTransaction();
      await transactionManager.getRepository(UserEntity).update(user.id, {
        isEmailVerified: true,
        verificationToken: undefined,
      });
      await transactionManager.commitTransaction();

      return new CommonResponse(true, 200, 'Email verified successfully');
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Error verifying email';
      return new CommonResponse(false, 400, errorMessage);
    }
  }

  async loginUser(reqModel: UserLoginModel): Promise<CommonResponse> {
    try {
      const user = await this.userRepository.findOne({ where: { email: reqModel.email } });
      if (!user) {
        return new CommonResponse(false, 401, 'Invalid credentials');
      }

      if (!user.isEmailVerified) {
        return new CommonResponse(false, 403, 'Email not verified');
      }

      const secretKey = process.env.ENCRYPTION_KEY;
      if (!secretKey) {
        throw new Error('Missing ENCRYPTION_KEY');
      }

      const decryptedPassword = CryptoJS.AES.decrypt(reqModel.password, secretKey).toString(CryptoJS.enc.Utf8);
      const isPasswordValid = await bcrypt.compare(decryptedPassword, user.password);
      if (!isPasswordValid) {
        return new CommonResponse(false, 401, 'Invalid credentials');
      }

      const transactionManager = new GenericTransactionManager(this.dataSource);
      await transactionManager.startTransaction();

      await transactionManager.getRepository(UserEntity).update(user.id, {
        status: 'online',
        lastSeen: new Date(),
      });

      await transactionManager.commitTransaction();

      const payload = { username: user.username, sub: user.id };
      const accessToken = this.jwtService.sign(payload, { expiresIn: '7d' });
      const refreshToken = this.jwtService.sign(payload, { expiresIn: '15d' });

      return new CommonResponse(true, 200, 'User logged in successfully', {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          mobile: user.phoneNumber,
        },
      });
    } catch (error) {
      const transactionManager = new GenericTransactionManager(this.dataSource);
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return new CommonResponse(false, 500, errorMessage);
    }
  }

  async getUserById(reqModel: UserIdRequestModel): Promise<CommonResponse> {
    try {
      const user = await this.userRepository.findOne({ where: { id: reqModel.userId } });
      if (!user) {
        return new CommonResponse(false, 404, 'User not found');
      }
      const { password, verificationToken, ...userResponse } = user;
      return new CommonResponse(true, 200, 'User fetched successfully', userResponse);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return new CommonResponse(false, 500, errorMessage);
    }
  }

  async updateUser(reqModel: UpdateUserModel): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      await this.userRepository.findOneOrFail({ where: { id: reqModel.userId } });

      await transactionManager.startTransaction();

      const updateData: Partial<UserEntity> = {
        username: reqModel.username,
        email: reqModel.email,
        profilePicture: reqModel.profilePicture,
        bio: reqModel.bio,
        phoneNumber: reqModel.phoneNumber,
        address: reqModel.address,
        dateOfBirth: reqModel.dateOfBirth,
      };

      if (reqModel.password) {
        const saltRounds = 10;
        updateData.password = await bcrypt.hash(reqModel.password, saltRounds);
      }

      await transactionManager.getRepository(UserEntity).update(reqModel.userId, updateData);
      const updatedUser = await this.userRepository.findOneOrFail({ where: { id: reqModel.userId } });

      await transactionManager.commitTransaction();

      const { password, verificationToken, ...userResponse } = updatedUser;
      return new CommonResponse(true, 200, 'User updated successfully', userResponse);
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Error updating user';
      return new CommonResponse(false, errorMessage.includes('not found') ? 404 : 500, errorMessage);
    }
  }

  async deleteUser(reqModel: UserIdRequestModel): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const user = await this.userRepository.findOne({ where: { id: reqModel.userId } });
      if (!user) {
        throw new Error('User not found');
      }

      await transactionManager.startTransaction();
      await transactionManager.getRepository(UserEntity).softRemove(user);
      await transactionManager.commitTransaction();

      return new CommonResponse(true, 200, 'User deleted successfully');
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Error deleting user';
      return new CommonResponse(false, errorMessage.includes('not found') ? 404 : 500, errorMessage);
    }
  }

  async logoutUser(userId: string): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      if (!userId) {
        throw new Error('Invalid user ID');
      }

      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      await transactionManager.startTransaction();
      await transactionManager.getRepository(UserEntity).update(user.id, {
        status: 'offline',
        lastSeen: new Date(),
      });
      await transactionManager.commitTransaction();

      return new CommonResponse(true, 200, 'User logged out successfully');
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Error logging out user';
      return new CommonResponse(false, errorMessage.includes('not found') || errorMessage.includes('Invalid') ? 400 : 500, errorMessage);
    }
  }

  async checkUserStatus(reqModel: UserIdRequestModel): Promise<CommonResponse> {
    try {
      const user = await this.userRepository.findOne({ where: { id: reqModel.userId } });
      if (!user) {
        return new CommonResponse(false, 404, 'User not found');
      }
      return new CommonResponse(true, 200, 'User status fetched successfully', {
        status: user.status,
        lastSeen: user.lastSeen || user.updatedAt,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error fetching user status';
      return new CommonResponse(false, 500, errorMessage);
    }
  }

  async getUserActivityStatus(reqModel: UserIdRequestModel): Promise<CommonResponse> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: reqModel.userId },
        select: ['id', 'status', 'lastSeen', 'createdAt', 'updatedAt'],
      });
      if (!user) {
        return new CommonResponse(false, 404, 'User not found');
      }
      return new CommonResponse(true, 200, 'User activity status fetched successfully', {
        status: user.status,
        isOnline: user.status === 'online',
        lastSeen: user.lastSeen || user.updatedAt,
        firstLogin: user.createdAt,
        lastActivity: user.updatedAt,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return new CommonResponse(false, 500, `Error fetching user activity status: ${errorMessage}`);
    }
  }

  async sendResetPasswordEmail(reqModel: EmailRequestModel): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      if (!reqModel?.email) {
        throw new Error('Email is required');
      }

      const user = await this.userRepository.findOne({ where: { email: reqModel.email } });
      if (!user) {
        throw new Error('User not found');
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); 

      await transactionManager.startTransaction();

      await transactionManager.getRepository(UserEntity).update(user.id, {
        resetPasswordExpires,
      });

      await transactionManager.commitTransaction();

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Password Reset OTP',
        html: `<!DOCTYPE html>
          <html>
            <body style="margin: 0; padding: 0; background-color: #ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding: 20px 0; background-color: #ffffff;">
                <tr>
                  <td style="padding: 30px; text-align: center;">
                    <p style="font-size: 18px; color: #333333; font-family: Arial, sans-serif; margin: 0 0 20px;">
                      Your One-Time Password (OTP) for password reset is:
                    </p>
                    <div style="display: inline-block; background-color: #f2f2f2; padding: 15px 30px; border-radius: 8px; font-size: 24px; font-weight: bold; color: #8a2be2; font-family: monospace; letter-spacing: 2px;">
                      ${otp}
                    </div>
                    <p style="font-size: 16px; color: #666666; font-family: Arial, sans-serif; margin-top: 25px;">
                      This code will expire in <strong>15 minutes</strong>. Please do not share it with anyone.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px; text-align: center; background-color: #f9f9f9;">
                    <p style="font-size: 14px; color: #999999; font-family: Arial, sans-serif; margin: 0;">
                      If you did not request a password reset, please ignore this message.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px; text-align: center; font-size: 12px; color: #aaaaaa; font-family: Arial, sans-serif;">
                    © 2025 In-One. All rights reserved.
                  </td>
                </tr>
              </table>
            </body>
          </html>`,
      });

      return new CommonResponse(true, 200, 'OTP sent successfully');
    } catch (error) {
      console.log(error)
      await transactionManager.rollbackTransaction();
      return new CommonResponse(false, 1, 'Error Sending OTP', error);
    }
}


  async resetPassword(reqModel: ResetPassowordModel): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const user = await this.userRepository.findOne({ where: { email: reqModel.email } });
      if (!user) {
        throw new Error('User not found');
      }

      if (
        !user.resetPasswordExpires ||
        user.resetPasswordExpires < new Date()
      ) {
        throw new Error('Invalid or expired OTP');
      }

      await transactionManager.startTransaction();

      const hashedPassword = await bcrypt.hash(reqModel.newPassword, 10);
      await transactionManager.getRepository(UserEntity).update(user.id, {
        password: hashedPassword,
      });

      await transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Password reset successfully');
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Error resetting password';
      return new CommonResponse(false, errorMessage.includes('not found') || errorMessage.includes('Invalid') ? 400 : 500, errorMessage);
    }
  }
}
