import { UserIdRequestModel, CommonResponse, UserActivityStatus } from "@in-one/shared-models";
import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { UserRepository } from "./repository/user.repository";


@Injectable()
export class UserInfoService {
    constructor(
        @InjectRepository(UserRepository)
        private readonly userRepository: UserRepository,
        private readonly jwtService: JwtService,
        private readonly dataSource: DataSource,
    ) { }


    async getUserById(reqModel: UserIdRequestModel): Promise<CommonResponse> {
        try {
            const user = await this.userRepository.findOne({ where: { id: reqModel.userId } });
            if (!user) {
                return new CommonResponse(false, 404, 'User not found');
            }
            const { password, verificationToken, ...userResponse } = user;
            return new CommonResponse(true, 200, 'User fetched successfully', userResponse);
        } catch (error) {
            return new CommonResponse(false, 500, 'User Fetching Failed', error);
        }
    }

    async getUserActivityStatus(reqModel: UserIdRequestModel): Promise<CommonResponse> {
        try {
            const user = await this.userRepository.findOne({ where: { id: reqModel.userId }, select: ['id', 'status', 'lastSeen', 'createdAt', 'updatedAt'] });
            if (!user) {
                return new CommonResponse(false, 404, 'User not found');
            }

            const status = user.status;
            const isOnline = status === 'online';
            const lastSeen = user.lastSeen || user.updatedAt;
            const firstLogin = user.createdAt;
            const lastActivity = user.updatedAt;

            const activityStatus = new UserActivityStatus(status, isOnline, lastSeen, firstLogin, lastActivity);
            return new CommonResponse(true, 200, 'User activity status fetched successfully', activityStatus);
        } catch (error) {
            return new CommonResponse(false, 500, 'Error fetching user activity status', error);
        }
    }
}