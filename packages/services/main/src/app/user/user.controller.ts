import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { CommonResponse, CreateUserModel, EmailRequestModel, ResetPassowordModel, returnException, UpdateUserModel, UserIdRequestModel, UserLoginModel } from '@in-one/shared-models';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { UserInfoService } from './user.info.services';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly infoService: UserInfoService
  ) {}

  @Post('createUser')
  @ApiBody({ type: CreateUserModel })
  async createUser(@Body() reqModel: CreateUserModel): Promise<CommonResponse> {
    try {
      return await this.userService.createUser(reqModel);
    } catch (error) {
      return returnException(CommonResponse, error);
    }
  }

  @Post('loginUser')
  @ApiBody({ type: UserLoginModel })
  async loginUser(@Body() userLoginDto: UserLoginModel): Promise<CommonResponse> {
    try {
      return await this.userService.loginUser(userLoginDto);
    } catch (error) {
      return returnException(CommonResponse, error);
    }
  }

  @Post('verifyEmail')
  @ApiBody({ schema: { properties: { token: { type: 'string' } } } })
  async verifyEmail(@Body('token') token: string): Promise<CommonResponse> {
    try {
      return await this.userService.verifyEmail(token);
    } catch (error) {
      return returnException(CommonResponse, error);
    }
  }

  @Post('getUserById')
  @ApiBody({ type: UserIdRequestModel })
  async getUserById(@Body() reqModel: UserIdRequestModel): Promise<CommonResponse> {
    try {
      return await this.infoService.getUserById(reqModel);
    } catch (error) {
      return returnException(CommonResponse, error);
    }
  }

  @Post('updateUser')
  @ApiBody({ type: UpdateUserModel })
  async updateUser(@Body() reqModel: UpdateUserModel): Promise<CommonResponse> {
    try {
      return await this.userService.updateUser(reqModel);
    } catch (error) {
      return returnException(CommonResponse, error);
    }
  }

  @Post('deleteUser')
  @ApiBody({ type: UserIdRequestModel })
  async deleteUser(@Body() reqModel: UserIdRequestModel): Promise<CommonResponse> {
    try {
      return await this.userService.deleteUser(reqModel);
    } catch (error) {
     return returnException(CommonResponse, error);
    }
  }

  @Post('logoutUser')
  @ApiBody({ schema: { properties: { userId: { type: 'string' } } } })
  async logoutUser(@Body('userId') userId: string): Promise<CommonResponse> {
    try {
      return await this.userService.logoutUser(userId);
    } catch (error) {
      return returnException(CommonResponse, error);
    }
  }

  @Post('status')
  @ApiBody({ type: UserIdRequestModel })
  async checkUserStatus(@Body() reqModel: UserIdRequestModel): Promise<CommonResponse> {
    try {
      return await this.userService.checkUserStatus(reqModel);
    } catch (error) {
      return returnException(CommonResponse, error);
    }
  }

  @Post('getUserActivityStatus')
  @ApiBody({ type: UserIdRequestModel })
  async getUserActivityStatus(@Body() reqModel: UserIdRequestModel): Promise<CommonResponse> {
    try {
      return await this.infoService.getUserActivityStatus(reqModel);
    } catch (error) {
      return returnException(CommonResponse, error);
    }
  }

  @Post('forgotPassword')
  @ApiBody({ type: EmailRequestModel })
  async forgotPassword(@Body() reqModel: EmailRequestModel): Promise<CommonResponse> {
    try {
      return await this.userService.sendResetPasswordEmail(reqModel);
    } catch (error) {
      return returnException(CommonResponse, error);
    }
  }

  @Post('resetPassword')
  @ApiBody({ type: ResetPassowordModel })
  async resetPassword(@Body() reqModel: ResetPassowordModel): Promise<CommonResponse> {
    try {
      return await this.userService.resetPassword(reqModel);
    } catch (error) {
     return returnException(CommonResponse, error);
    }
  }
}