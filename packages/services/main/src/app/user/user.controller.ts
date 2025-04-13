import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { CommonResponse, CreateUserModel, EmailRequestModel, ExceptionHandler, ResetPassowordModel, UpdateUserModel, UserIdRequestModel, UserLoginModel } from '@in-one/shared-models';
import { ApiBody, ApiTags } from '@nestjs/swagger';

export interface ScreenPreferencesModel {
  userId: string;
  preferences: { [key: string]: boolean };
}


@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post('createUser')
  @ApiBody({ type: CreateUserModel })
  async createUser(@Body() reqModel: CreateUserModel): Promise<CommonResponse> {
    try {
      return await this.userService.createUser(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error creating user');
    }
  }

  @Post('loginUser')
  @ApiBody({ type: UserLoginModel })
  async loginUser(@Body() userLoginDto: UserLoginModel): Promise<CommonResponse> {
    try {
      return await this.userService.loginUser(userLoginDto);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error logging in user');
    }
  }

  @Post('getUserById')
  @ApiBody({ type: UserIdRequestModel })
  async getUserById(@Body() reqModel: UserIdRequestModel): Promise<CommonResponse> {
    try {
      return await this.userService.getUserById(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error fetching user');
    }
  }

  @Post('updateUser')
  @ApiBody({ type: UpdateUserModel })
  async updateUser(@Body('userId') reqModel: UpdateUserModel): Promise<CommonResponse> {
    try {
      return await this.userService.updateUser(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error updating user');
    }
  }

  @Post('deleteUser')
  @ApiBody({ type: UserIdRequestModel })
  async deleteUser(@Body('userId') reqModel: UserIdRequestModel): Promise<CommonResponse> {
    try {
      return await this.userService.deleteUser(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error deleting user');
    }
  }

  @Post('logoutUser')
  @ApiBody({ schema: { properties: { userId: { type: 'string' } } } })
  async logoutUser(@Body('userId') userId: string): Promise<CommonResponse> {
    try {
      return await this.userService.logoutUser(userId);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error logging out user');
    }
  }

  @Post('status')
  @ApiBody({ type: UserIdRequestModel })
  async checkUserStatus(@Body('userId') reqModel: UserIdRequestModel): Promise<CommonResponse> {
    try {
      return await this.userService.checkUserStatus(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error fetching user status');
    }
  }

  @Post('getUserActivityStatus')
  @ApiBody({ type: UserIdRequestModel })
  async getUserActivityStatus(@Body('userId') reqModel: UserIdRequestModel): Promise<CommonResponse> {
    try {
      return await this.userService.getUserActivityStatus(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error fetching user status');
    }
  }

  @Post('resetPassword')
  @ApiBody({ type: ResetPassowordModel })
  async resetPassword(@Body() reqModel: ResetPassowordModel): Promise<CommonResponse> {
    try {
      return await this.userService.resetPassword(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error resetting password');
    }
  }

  @Post('forgotPassword')
  @ApiBody({ type: EmailRequestModel })
  async forgotPassword(@Body() reqModel: EmailRequestModel): Promise<CommonResponse> {
    try {
      return await this.userService.sendResetPasswordEmail(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error sending OTP');
    }
  }
}

