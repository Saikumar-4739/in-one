import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserEntity, UserDocument } from './schema/user.schema';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CommonResponse, CreateUserModel, UpdateUserModel, UserLoginModel } from '@in-one/shared-models';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(UserEntity.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async createUser(createUserDto: CreateUserModel): Promise<CommonResponse<UserEntity>> {
    try {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const user = await this.userModel.create({
        ...createUserDto,
        password: hashedPassword,
        status: 'offline',
      });
      return new CommonResponse<UserEntity>(true, 200, 'User created successfully', user);
    } catch (error) {
      return new CommonResponse<UserEntity>(false, 500, 'Error creating user');
    }
  }

  async loginUser(userLoginDto: UserLoginModel): Promise<CommonResponse<{ accessToken: string }>> {
    try {
      const user = await this.userModel.findOne({ username: userLoginDto.username }).exec();
      if (!user) throw new UnauthorizedException('Invalid credentials');

      const isPasswordValid = await bcrypt.compare(userLoginDto.password, user.password);
      if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

      const payload = { username: user.username, sub: user._id };
      const accessToken = this.jwtService.sign(payload);

      await this.userModel.findByIdAndUpdate(user._id, { status: 'online' }).exec();

      return new CommonResponse<{ accessToken: string }>(true, 200, 'User logged in successfully', { accessToken });
    } catch (error) {
      return new CommonResponse<{ accessToken: string }>(false, 500, 'Error logging in user');
    }
  }

  async getUserById(userId: string): Promise<CommonResponse<UserEntity>> {
    try {
      const user = await this.userModel.findById(userId).exec();
      if (!user) throw new NotFoundException('User not found');
      return new CommonResponse<UserEntity>(true, 200, 'User fetched successfully', user);
    } catch (error) {
      return new CommonResponse<UserEntity>(false, 500, 'Error fetching user');
    }
  }

  async updateUser(userId: string, updateUserDto: UpdateUserModel): Promise<CommonResponse<UserEntity>> {
    try {
      const user = await this.userModel.findByIdAndUpdate(userId, updateUserDto, { new: true }).exec();
      if (!user) throw new NotFoundException('User not found');
      return new CommonResponse<UserEntity>(true, 200, 'User updated successfully', user);
    } catch (error) {
      return new CommonResponse<UserEntity>(false, 500, 'Error updating user');
    }
  }

  async deleteUser(userId: string): Promise<CommonResponse<null>> {
    try {
      const user = await this.userModel.findByIdAndDelete(userId).exec();
      if (!user) throw new NotFoundException('User not found');
      return new CommonResponse<null>(true, 200, 'User deleted successfully');
    } catch (error) {
      return new CommonResponse<null>(false, 500, 'Error deleting user');
    }
  }

  async logoutUser(userId: string): Promise<CommonResponse<null>> {
    try {
      await this.userModel.findByIdAndUpdate(userId, { status: 'offline' }).exec();
      return new CommonResponse<null>(true, 200, 'User logged out successfully');
    } catch (error) {
      return new CommonResponse<null>(false, 500, 'Error logging out user');
    }
  }

  async checkUserStatus(userId: string): Promise<CommonResponse<{ status: string }>> {
    try {
      const user = await this.userModel.findById(userId).exec();
      if (!user) throw new NotFoundException('User not found');
      return new CommonResponse<{ status: string }>(true, 200, 'User status fetched successfully', { status: user.status });
    } catch (error) {
      return new CommonResponse<{ status: string }>(false, 500, 'Error fetching user status');
    }
  }
}