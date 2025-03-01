import { AxiosRequestConfig } from 'axios';
import { CommonAxiosService } from '../common-axios-service';
import { GlobalResponseObject, CreateUserModel, UpdateUserModel, UserLoginModel } from '@in-one/shared-models'; // Assuming these are from shared models\

export class UserHelpService extends CommonAxiosService {

    private getURLwithMainEndPoint(childUrl: string): string {
        return `/users/${childUrl}`;
    }

    async createUser(createUserDto: CreateUserModel, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('createUser'), createUserDto, config); // No try-catch block
    }

    async loginUser(userLoginDto: UserLoginModel, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('loginUser'), userLoginDto, config); // No try-catch block
    }

    async getUserById(userId: string, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getUserById'), { userId }, config); // No try-catch block
    }

    async updateUser(userId: string, updateData: UpdateUserModel, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('updateUser'), { userId, updateData }, config); // No try-catch block
    }

    async deleteUser(userId: string, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('deleteUser'), { userId }, config); // No try-catch block
    }

    async logoutUser(userId: string, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('logoutUser'), { userId }, config); // No try-catch block
    }

    async checkUserStatus(userId: string, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('status'), { userId }, config); // No try-catch block
    }
}
