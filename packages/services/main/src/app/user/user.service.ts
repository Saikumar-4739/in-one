// src/services/user.service.ts
import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import * as CryptoJS from 'crypto-js';
import { CommonResponse, CreateUserModel, EmailRequestModel, ResetPassowordModel, UserIdRequestModel, UserLoginModel, UserRole, WelcomeRequestModel, UpdateUserModel } from '@in-one/shared-models';
import { GenericTransactionManager } from 'src/database/trasanction-manager';
import { UserRepository } from './repository/user.repository';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserService {
  logger: any;
  constructor(
    @InjectRepository(UserRepository)
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly transactionManager: GenericTransactionManager,
  ) { }

  async createUser(reqModel: CreateUserModel): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const passwordRegex = /^(?=(.*[a-z]){2,})(?=(.*[A-Z]){1,})(?=(.*\d){1,})(?=(.*[@$!%*?&#_+\-/]){2,})[A-Za-z\d@$!%*?&#_+\-/]{8,}$/;
      if (!passwordRegex.test(reqModel.password)) {
        throw new Error(
          'Password must be at least 8 characters long, with at least 2 lowercase letters, 1 uppercase letter, 1 number, and 2 special characters (@, $, !, %, *, ?, &, #, _, -, +, /)',
        );
      }

      const userRepo = this.transactionManager.getRepository(this.userRepository);
      const existingUser = await userRepo.findOne({
        where: [{ username: reqModel.username }, { email: reqModel.email }],
      });
      if (existingUser) {
        throw new Error('Username or email already exists');
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(reqModel.password, saltRounds);

      const user = userRepo.create({
        username: reqModel.username,
        email: reqModel.email,
        password: hashedPassword,
        profilePicture: reqModel.profilePicture,
        status: 'offline',
        role: reqModel.role || UserRole.USER,
      });

      const savedUser = await userRepo.save(user);
      await this.transactionManager.commitTransaction();

      try {
        await this.sendWelcomeEmail({ email: reqModel.email, username: reqModel.username });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }

      const { password, ...userResponse } = savedUser;
      return new CommonResponse(true, 201, 'User created successfully', userResponse);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
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
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; text-align: center;">
            <h2 style="color: #333;">Hello, ${reqModel.username}!</h2>
            <p style="color: #555;">Welcome to our platform!</p>
            <p style="color: #777;">Best Regards,<br><strong>Your Team</strong></p>
        </body>
        </html>`,
      };
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending welcome email:', error);
    }
  }

  async loginUser(reqModel: UserLoginModel): Promise<CommonResponse> {
    try {
      const user = await this.userRepository.findOne({ where: { email: reqModel.email } });
      if (!user) {
        return new CommonResponse(false, 401, 'Invalid credentials');
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

      const payload = { username: user.username, sub: user.id };
      const accessToken = this.jwtService.sign(payload, { expiresIn: '7d' });
      const refreshToken = this.jwtService.sign(payload, { expiresIn: '15d' });

      await this.userRepository.update(user.id, {
        status: 'online',
        lastSeen: new Date(),
      });

      return new CommonResponse(true, 200, 'User logged in successfully', {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
      });
    } catch (error) {
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
      return new CommonResponse(true, 200, 'User fetched successfully', user);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return new CommonResponse(false, 500, errorMessage);
    }
  }

  async updateUser(reqModel: UpdateUserModel): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const userRepo = this.transactionManager.getRepository(this.userRepository);
      const user = await userRepo.findOne({ where: { id: reqModel.userId } });
      if (!user) {
        await this.transactionManager.rollbackTransaction();
        return new CommonResponse(false, 404, 'User not found');
      }

      await userRepo.update(reqModel.userId, reqModel);
      const updatedUser = await userRepo.findOne({ where: { id: reqModel.userId } });
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'User updated successfully', updatedUser);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Error updating user');
    }
  }

  async deleteUser(reqModel: UserIdRequestModel): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const userRepo = this.transactionManager.getRepository(this.userRepository);
      const user = await userRepo.findOne({ where: { id: reqModel.userId } });
      if (!user) {
        await this.transactionManager.rollbackTransaction();
        return new CommonResponse(false, 404, 'User not found');
      }
      await userRepo.remove(user);
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'User deleted successfully');
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Error deleting user');
    }
  }

  async logoutUser(userId: string): Promise<CommonResponse> {
    try {
      if (!userId) {
        return new CommonResponse(false, 400, 'Invalid user ID');
      }
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        return new CommonResponse(false, 404, 'User not found');
      }
      user.status = 'offline';
      user.lastSeen = new Date();
      await this.userRepository.save(user);
      return new CommonResponse(true, 200, 'User logged out successfully');
    } catch (error) {
      return new CommonResponse(false, 500, 'Error logging out user');
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
        lastSeen: user.updatedAt,
      });
    } catch (error) {
      return new CommonResponse(false, 500, 'Error fetching user status');
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
    try {
      if (!reqModel?.email) {
        return new CommonResponse(false, 400, 'Email is required');
      }
      const user = await this.userRepository.findOne({ where: { email: reqModel.email } });
      if (!user) {
        return new CommonResponse(false, 404, 'User not found');
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);

      await this.userRepository.update(user.id, { resetPasswordOtp: otp, resetPasswordExpires });

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Password Reset OTP',
        text: `Your OTP for password reset is ${otp}. It expires in 15 minutes.`,
      });

      return new CommonResponse(true, 200, 'OTP sent successfully');
    } catch (error) {
      console.error('Error in sendResetPasswordEmail:', error);
      return new CommonResponse(false, 500, 'Error sending OTP');
    }
  }

  async resetPassword(reqModel: ResetPassowordModel): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const userRepo = this.transactionManager.getRepository(this.userRepository);
      const user = await userRepo.findOne({ where: { email: reqModel.email } });
      if (!user) {
        await this.transactionManager.rollbackTransaction();
        return new CommonResponse(false, 404, 'User not found');
      }

      if (
        user.resetPasswordOtp?.toString() !== reqModel.otp.toString() ||
        !user.resetPasswordExpires ||
        user.resetPasswordExpires < new Date()
      ) {
        await this.transactionManager.rollbackTransaction();
        return new CommonResponse(false, 401, 'Invalid or expired OTP');
      }

      const hashedPassword = await bcrypt.hash(reqModel.newPassword, 10);
      await userRepo.update(user.id, {
        password: hashedPassword,
      });

      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Password reset successfully');
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Error resetting password');
    }
  }
}
