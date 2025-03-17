import { Inject, Injectable } from '@nestjs/common';
import { UserEntity, UserStatus } from './entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CommonResponse, CreateUserModel, EmailRequestModel, ResetPassowordModel, UpdateUserModel, UserIdRequestModel, UserLoginModel, UserRole, WelcomeRequestModel } from '@in-one/shared-models';
import { GenericTransactionManager } from 'src/database/trasanction-manager';
import * as nodemailer from 'nodemailer';
import type { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { UserRepository } from './repository/user.repository';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserRepository)
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly transactionManager: GenericTransactionManager,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) { }

  async createUser(reqModel: CreateUserModel): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const hashedPassword = await bcrypt.hash(reqModel.password, 10);
      const userRepo = this.transactionManager.getRepository(this.userRepository);
      const user = userRepo.create({
        ...reqModel,
        password: hashedPassword,
        profilePicture: reqModel.profilePicture,
        status: UserStatus.OFFLINE,
        role: reqModel.role || UserRole.USER, // Assign role, default to 'USER'
      });
      const savedUser = await userRepo.save(user);
      await this.transactionManager.commitTransaction();
      await this.sendWelcomeEmail(new WelcomeRequestModel(reqModel.email, reqModel.username));
      return new CommonResponse(true, 0, 'User created successfully', savedUser);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Error creating user', null);
    }
  }


  async send2FAOtp(reqModel: EmailRequestModel): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const userRepo = this.transactionManager.getRepository(this.userRepository);
      const user = await userRepo.findOne({ where: { email: reqModel.email } });
      if (!user) {
        await this.transactionManager.rollbackTransaction();
        return new CommonResponse(false, 404, 'User not found');
      }
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.twoFactorOtp = otp;
      user.twoFactorExpires = new Date(Date.now() + 5 * 60 * 1000);
      await userRepo.save(user);
      await this.transactionManager.commitTransaction();
      await this.sendWelcomeEmail(new WelcomeRequestModel(reqModel.email, `Your OTP is ${otp}`));
      return new CommonResponse(true, 200, '2FA OTP sent successfully');
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Error sending 2FA OTP');
    }
  }

  async sendWelcomeEmail(reqModel: WelcomeRequestModel): Promise<void> {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: reqModel.email,
        subject: 'Welcome to Our Platform!',
        html: `
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Welcome Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; text-align: center; border-radius: 10px; width: 80%; margin: auto;">
            <h2 style="color: #333;">Hello, <span style="color: #007BFF;">${reqModel.username}</span>!</h2>
            <p style="color: #555; font-size: 16px;">Welcome to our platform! We're excited to have you on board.</p>
            <p style="color: #777; font-size: 14px;">Best Regards,<br><strong>Your Team</strong></p>
        </body>
        </html>`
      };
      await transporter.sendMail(mailOptions);
      console.log(`📧 Welcome email sent to ${reqModel.email}`);
    } catch (error) {
    }
  }

  async loginUser(reqModel: UserLoginModel): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const userRepo = this.transactionManager.getRepository(this.userRepository);

      const user = await userRepo.findOne({ where: { email: reqModel.email } });

      if (!user) {
        await this.transactionManager.rollbackTransaction();
        return new CommonResponse(false, 401, 'Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(reqModel.password, user.password);
      if (!isPasswordValid) {
        await this.transactionManager.rollbackTransaction();
        return new CommonResponse(false, 401, 'Invalid credentials');
      }

      const payload = { username: user.username, sub: user.id };
      const accessToken = this.jwtService.sign(payload, { expiresIn: '7d' });
      const refreshToken = this.jwtService.sign(payload, { expiresIn: '15d' });

      await userRepo.update(user.id, { status: UserStatus.ONLINE });

      await this.transactionManager.commitTransaction();

      return new CommonResponse(true, 200, 'User logged in successfully', {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          profilePicture: user.profilePicture,
          username: user.username,
        },
      });
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return new CommonResponse(false, 500, errorMessage);
    }
  }

  async getUserById(reqModel: UserIdRequestModel): Promise<CommonResponse> {
    try {
      // 🔹 Fetch user directly from the database
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
    await this.transactionManager.startTransaction(); 
    try {
      const userRepo = this.transactionManager.getRepository(this.userRepository);
      const user = await userRepo.findOne({ where: { id: userId } });
      if (!user) {
        await this.transactionManager.rollbackTransaction();
        return new CommonResponse(false, 404, 'User not found');
      }
      await userRepo.update(userId, { status: UserStatus.OFFLINE });
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'User logged out successfully');
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('Logout error:', error); 
      return new CommonResponse(false, 500, 'Error logging out user');
    }
  }

  async checkUserStatus(reqModel: UserIdRequestModel): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const userRepo = this.transactionManager.getRepository(this.userRepository);
      const user = await userRepo.findOne({ where: { id: reqModel.userId } });
      if (!user) {
        await this.transactionManager.rollbackTransaction();
        return new CommonResponse(false, 404, 'User not found');
      }
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'User status fetched successfully', { status: user.status });
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Error fetching user status');
    }
  }

  async sendResetPasswordEmail(reqModel: EmailRequestModel): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();

    try {
      const userRepo = this.transactionManager.getRepository(this.userRepository);
      const user = await userRepo.findOne({ where: { email: reqModel.email } });
      if (!user) {
        await this.transactionManager.rollbackTransaction();
        return new CommonResponse(false, 404, 'User not found');
      }
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
      await userRepo.update(user.id, { resetPasswordOtp: otp, resetPasswordExpires });
      await this.transactionManager.commitTransaction();
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: reqModel.email,
        subject: 'Password Reset OTP',
        text: `Your OTP for password reset is ${otp}`,
      });
      return new CommonResponse(true, 200, 'OTP sent successfully');
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
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
      if (user.resetPasswordOtp !== reqModel.otp || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
        await this.transactionManager.rollbackTransaction();
        return new CommonResponse(false, 401, 'Invalid or expired OTP');
      }
      const hashedPassword = await bcrypt.hash(reqModel.newPassword, 10);
      await userRepo.update(user.id, {
        password: hashedPassword,
        resetPasswordOtp: null as any,
        resetPasswordExpires: null as any,
      });
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Password reset successfully');
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Error resetting password');
    }
  }
}

