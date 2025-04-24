import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { CommonResponse, CreateUserModel, EmailRequestModel, ExceptionHandler, ResetPassowordModel, UpdateUserModel, UserIdRequestModel, UserLoginModel } from '@in-one/shared-models';
import { ApiBody, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('createUser')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: CreateUserModel })
  async createUser(@Body() reqModel: CreateUserModel): Promise<CommonResponse> {
    try {
      return await this.userService.createUser(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error creating user');
    }
  }

  @Post('loginUser')
  @ApiOperation({ summary: 'Log in a user' })
  @ApiBody({ type: UserLoginModel })
  async loginUser(@Body() userLoginDto: UserLoginModel): Promise<CommonResponse> {
    try {
      return await this.userService.loginUser(userLoginDto);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error logging in user');
    }
  }

  @Post('verifyEmail')
  @ApiOperation({ summary: 'Verify user email with token' })
  @ApiBody({ schema: { properties: { token: { type: 'string' } } } })
  async verifyEmail(@Body('token') token: string): Promise<CommonResponse> {
    try {
      return await this.userService.verifyEmail(token);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error verifying email');
    }
  }

  @Post('getUserById')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiBody({ type: UserIdRequestModel })
  async getUserById(@Body() reqModel: UserIdRequestModel): Promise<CommonResponse> {
    try {
      return await this.userService.getUserById(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error fetching user');
    }
  }

  @Post('updateUser')
  @ApiOperation({ summary: 'Update user details' })
  @ApiBody({ type: UpdateUserModel })
  async updateUser(@Body() reqModel: UpdateUserModel): Promise<CommonResponse> {
    try {
      return await this.userService.updateUser(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error updating user');
    }
  }

  @Post('deleteUser')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiBody({ type: UserIdRequestModel })
  async deleteUser(@Body() reqModel: UserIdRequestModel): Promise<CommonResponse> {
    try {
      return await this.userService.deleteUser(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error deleting user');
    }
  }

  @Post('logoutUser')
  @ApiOperation({ summary: 'Log out a user' })
  @ApiBody({ schema: { properties: { userId: { type: 'string' } } } })
  async logoutUser(@Body('userId') userId: string): Promise<CommonResponse> {
    try {
      return await this.userService.logoutUser(userId);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error logging out user');
    }
  }

  @Post('status')
  @ApiOperation({ summary: 'Check user online status' })
  @ApiBody({ type: UserIdRequestModel })
  async checkUserStatus(@Body() reqModel: UserIdRequestModel): Promise<CommonResponse> {
    try {
      return await this.userService.checkUserStatus(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error fetching user status');
    }
  }

  @Post('getUserActivityStatus')
  @ApiOperation({ summary: 'Get user activity status' })
  @ApiBody({ type: UserIdRequestModel })
  async getUserActivityStatus(@Body() reqModel: UserIdRequestModel): Promise<CommonResponse> {
    try {
      return await this.userService.getUserActivityStatus(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error fetching user activity status');
    }
  }

  @Post('forgotPassword')
  @ApiOperation({ summary: 'Send password reset email' })
  @ApiBody({ type: EmailRequestModel })
  async forgotPassword(@Body() reqModel: EmailRequestModel): Promise<CommonResponse> {
    try {
      return await this.userService.sendResetPasswordEmail(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error sending password reset email');
    }
  }

  @Post('resetPassword')
  @ApiOperation({ summary: 'Reset user password with token' })
  @ApiBody({ type: ResetPassowordModel })
  async resetPassword(@Body() reqModel: ResetPassowordModel): Promise<CommonResponse> {
    try {
      return await this.userService.resetPassword(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error resetting password');
    }
  }
}