import { BadRequestException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { UserEntity, UserDocument } from './schema/user.schema';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CommonResponse, CreateUserModel, UpdateUserModel, UserLoginModel } from '@in-one/shared-models';
import { GenericTransactionManager } from 'src/database/trasanction-manager';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import type { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager'

@Injectable()
export class UserService {
  constructor(
    @InjectModel(UserEntity.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly transactionManager: GenericTransactionManager,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) { }


  async createUser(createUserDto: CreateUserModel): Promise<CommonResponse<UserEntity>> {
    await this.transactionManager.startTransaction();

    try {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const user = await this.userModel.create({
        ...createUserDto,
        password: hashedPassword,
        profilePicture: null,
        status: 'offline',
        session: this.transactionManager.getSession(),
      });

      await this.transactionManager.commitTransaction();
      await this.sendWelcomeEmail(user.email, user.username);
      return new CommonResponse<UserEntity>(true, 200, 'User created successfully', user);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse<UserEntity>(false, 500, 'Error creating user');
    }
  }

  async uploadProfilePicture(userId: string, base64Image: string): Promise<CommonResponse<{ profilePictureUrl: string }>> {
    if (!base64Image.startsWith('data:image/')) {
      throw new BadRequestException('Invalid image format');
    }

    const matches = base64Image.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!matches) throw new BadRequestException('Invalid Base64 image format');

    const imageBuffer = Buffer.from(matches[2], 'base64');

    // Resize & compress image
    const optimizedBuffer = await sharp(imageBuffer)
      .resize(300, 300)
      .jpeg({ quality: 80 })
      .toBuffer();

    // Convert Buffer to Uint8Array to fix TypeScript error
    const uint8Array = new Uint8Array(optimizedBuffer);

    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const fileName = `${userId}.jpg`; // Convert all to .jpg for consistency
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, uint8Array); // FIX: Using Uint8Array

    const profilePictureUrl = `http://localhost:3000/uploads/${fileName}`;
    const user = await this.userModel.findByIdAndUpdate(userId, { profilePicture: profilePictureUrl }, { new: true }).exec();

    if (!user) throw new NotFoundException('User not found');
    return new CommonResponse<{ profilePictureUrl: string }>(true, 200, 'Profile picture uploaded successfully', { profilePictureUrl });
  }

  async send2FAOtp(email: string): Promise<CommonResponse<null>> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) throw new NotFoundException('User not found');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.twoFactorOtp = otp;
    user.twoFactorExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry
    await user.save();

    await this.sendWelcomeEmail(email, `Your OTP is ${otp}`);
    return new CommonResponse<null>(true, 200, '2FA OTP sent successfully');
  }


  async sendWelcomeEmail(email: string, username: string): Promise<void> {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {  user: 'ummidisettisai01@gmail.com', pass: 'mmzv wyec wgjc humt' },
    });

    const mailOptions = {
      from: 'your-email@gmail.com',
      to: email,
      subject: 'Welcome to Our Platform!',
      html: `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Welcome Email</title>
    </head>
    <body style="
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        padding: 20px;
        text-align: center;
        border-radius: 10px;
        width: 80%;
        margin: auto;
    ">
        <h2 style="color: #333;">Hello, <span style="color: #007BFF;">${username}</span>!</h2>
        <p style="color: #555; font-size: 16px;">
            Welcome to our platform! We're excited to have you on board.
        </p>
        <p style="color: #777; font-size: 14px;">Best Regards,<br><strong>Your Team</strong></p>
    </body>
    </html>`
    };
    

    await transporter.sendMail(mailOptions);
  }



async loginUser(userLoginDto: UserLoginModel): Promise<CommonResponse<{ accessToken: string, refreshToken: string, user: { id: string, email: string, profilePicture: string, username: string } }>> {
  try {
    // Explicitly type the user to include the correct types for _id
    const user = await this.userModel.findOne({ email: userLoginDto.email }).exec();

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(userLoginDto.password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    const payload = { username: user.email, sub: user._id };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    await this.userModel.findByIdAndUpdate(user._id, { status: 'online' }).exec();

    // Return the response with proper types and include user info
    return new CommonResponse<{ accessToken: string, refreshToken: string, user: { id: string, email: string, profilePicture: string, username: string } }>(
      true, 
      200, 
      'User logged in successfully', 
      { 
        accessToken, 
        refreshToken, 
        user: {
          id: (user._id as ObjectId).toString(),  // Cast _id to ObjectId and convert to string
          email: user.email, 
          profilePicture: user.profilePicture, 
          username: user.username 
        }
      }
    );
  } catch (error) {
    console.log(error);
    return new CommonResponse<{ accessToken: string, refreshToken: string, user: { id: string, email: string, profilePicture: string, username: string } }>(
      false, 
      500, 
      'Error logging in user', 
      { 
        accessToken: '', 
        refreshToken: '', 
        user: { id: '', email: '', profilePicture: '', username: '' }
      }
    );
  }
}




  async getUserById(userId: string): Promise<CommonResponse<UserEntity>> {
    const cachedUser = await this.cacheManager.get<UserEntity>(`user_${userId}`);
    if (cachedUser) return new CommonResponse<UserEntity>(true, 200, 'User fetched from cache', cachedUser);

    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');

    await this.cacheManager.set(`user_${userId}`, user, 300);
    return new CommonResponse<UserEntity>(true, 200, 'User fetched successfully', user);
  }

  async updateUser(userId: string, updateUserDto: UpdateUserModel): Promise<CommonResponse<UserEntity>> {
    await this.transactionManager.startTransaction();

    try {
      const user = await this.userModel.findByIdAndUpdate(userId, updateUserDto, {
        new: true,
        session: this.transactionManager.getSession(),
      }).exec();

      if (!user) throw new NotFoundException('User not found');

      await this.transactionManager.commitTransaction();

      return new CommonResponse<UserEntity>(true, 200, 'User updated successfully', user);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse<UserEntity>(false, 500, 'Error updating user');
    }
  }

  async deleteUser(userId: string): Promise<CommonResponse<null>> {
    await this.transactionManager.startTransaction();

    try {
      const user = await this.userModel.findByIdAndDelete(userId).exec();
      if (!user) throw new NotFoundException('User not found');

      await this.transactionManager.commitTransaction();

      return new CommonResponse<null>(true, 200, 'User deleted successfully');
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse<null>(false, 500, 'Error deleting user');
    }
  }

  async logoutUser(userId: string): Promise<CommonResponse<null>> {
    try {
      await this.userModel.findByIdAndUpdate(userId, { status: 'offline' }).exec();
      return new CommonResponse<null>(true, 200, 'User logged out successfully');
    } catch (error) {
      console.error('Logout error:', error); // Added console log for debugging
      return new CommonResponse<null>(false, 500, 'Error logging out user');
    }
  }
  

  async checkUserStatus(userId: string): Promise<CommonResponse<{ status: string }>> {
    try {
      const user = await this.userModel.findById(userId).exec();
      if (!user) throw new NotFoundException('User not found');
      return new CommonResponse<{ status: string }>(true, 200, 'User status fetched successfully', { status: user.status });
    } catch (error) {
      return new CommonResponse<{ status: string }>(false, 500, 'Error fetcspothing user status');
    }
  }

  async sendResetPasswordEmail(email: string): Promise<CommonResponse<null>> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) throw new NotFoundException('User not found');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiration
    await user.save();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: 'ummidisettisai01@gmail.com', pass: 'mmzv wyec wgjc humt' },
    });

    await transporter.sendMail({
      from: 'your-email@gmail.com',
      to: email,
      subject: 'Password Reset OTP',
      text: `Your OTP for password reset is ${otp}`,
    });

    return new CommonResponse<null>(true, 200, 'OTP sent successfully');
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<CommonResponse<null>> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user || user.resetPasswordOtp !== otp || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return new CommonResponse<null>(true, 200, 'Password reset successfully');
  }
}

