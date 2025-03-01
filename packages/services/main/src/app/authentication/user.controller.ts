import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { CommonResponse, CreateUserModel, ExceptionHandler, UpdateUserModel, UserLoginModel } from '@in-one/shared-models';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Users') 
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post('createUser')
  @ApiBody({ type: CreateUserModel })
  async createUser(@Body() createUserDto: CreateUserModel): Promise<CommonResponse<any>> {
    try {
      return await this.userService.createUser(createUserDto);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error creating user');
    }
  }

  @Post('loginUser')
  @ApiBody({ type: UserLoginModel })
  async loginUser(@Body() userLoginDto: UserLoginModel): Promise<CommonResponse<{ accessToken: string }>> {
    try {
      return await this.userService.loginUser(userLoginDto);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error logging in user');
    }
  }

  @Post('getUserById')
  @ApiBody({ schema: { properties: { userId: { type: 'string' } } } })
  async getUserById(@Body('userId') userId: string): Promise<CommonResponse<any>> {
    try {
      return await this.userService.getUserById(userId);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error fetching user');
    }
  }

  @Post('updateUser')
  @ApiBody({ schema: { properties: { userId: { type: 'string' }, updateData: { type: 'object' } } } })
  async updateUser( @Body('userId') userId: string, @Body() updateUserDto: Omit<UpdateUserModel, 'userId'>): Promise<CommonResponse<any>> {
    try {
      return await this.userService.updateUser(userId, updateUserDto);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error updating user');
    }
  }

  @Post('deleteUser')
  @ApiBody({ schema: { properties: { userId: { type: 'string' } } } })
  async deleteUser(@Body('userId') userId: string): Promise<CommonResponse<null>> {
    try {
      return await this.userService.deleteUser(userId);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error deleting user');
    }
  }

  @Post('logoutUser')
  @ApiBody({ schema: { properties: { userId: { type: 'string' } } } })
  async logoutUser(@Body('userId') userId: string): Promise<CommonResponse<null>> {
    try {
      return await this.userService.logoutUser(userId);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error logging out user');
    }
  }

  @Post('status')
  @ApiBody({ schema: { properties: { userId: { type: 'string' } } } })
  async checkUserStatus(@Body('userId') userId: string): Promise<CommonResponse<{ status: string }>> {
    try {
      return await this.userService.checkUserStatus(userId);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error fetching user status');
    }
  }

  @Post('forgotPassword')
  @ApiBody({ schema: { properties: { email: { type: 'string' } } } })
  async forgotPassword(@Body('email') email: string): Promise<CommonResponse<null>> {
    try {
      return await this.userService.sendResetPasswordEmail(email);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error sending reset password email');
    }
  }

  @Post('resetPassword')
  @ApiBody({ schema: { properties: { email: { type: 'string' }, otp: { type: 'string' }, newPassword: { type: 'string' } } } })
  async resetPassword( @Body('email') email: string, @Body('otp') otp: string, @Body('newPassword') newPassword: string): Promise<CommonResponse<null>> {
    try {
      return await this.userService.resetPassword(email, otp, newPassword);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error resetting password');
    }
  }

  @Post('uploadProfilePicture')
  @ApiBody({ schema: { properties: { userId: { type: 'string' }, base64Image: { type: 'string' } } } })
  async uploadProfilePicture( @Body('userId') userId: string, @Body('base64Image') base64Image: string): Promise<CommonResponse<{ profilePictureUrl: string }>> {
    try {
      return await this.userService.uploadProfilePicture(userId, base64Image);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error uploading profile picture');
    }
  }
}
