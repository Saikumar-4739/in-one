    import { AxiosRequestConfig } from 'axios';
    import { CommonAxiosService } from '../common-axios-service';
    import { CommonResponse, CreateChatRoomModel, CreateMessageModel, EditMessageModel, ChatRoomIdRequestModel, MessegeIdRequestModel, UserIdRequestModel, PrivateMessegeModel, CallModel, EndCallModel, AudioMessegeModel } from '@in-one/shared-models';

    export class ChatHelpService extends CommonAxiosService {
        private getURLwithMainEndPoint(childUrl: string): string {
            return `/chat/${childUrl}`;
        }

        async sendMessage(reqModel: CreateMessageModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
            return await this.axiosPostCall(this.getURLwithMainEndPoint('sendMessage'), reqModel, config);
        }

        async getMessages(reqModel: ChatRoomIdRequestModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
            return await this.axiosPostCall(this.getURLwithMainEndPoint('getAllMessages'), reqModel, config);
        }

        async editMessage(reqModel: EditMessageModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
            return await this.axiosPostCall(this.getURLwithMainEndPoint('editMessage'), reqModel, config);
        }

        async deleteMessage(reqModel: MessegeIdRequestModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
            return await this.axiosPostCall(this.getURLwithMainEndPoint('deleteMessage'), reqModel, config);
        }

        async getChatRooms(reqModel: UserIdRequestModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
            return await this.axiosPostCall(this.getURLwithMainEndPoint('getChatRooms'), reqModel, config);
        }

        async createChatRoom(reqModel: CreateChatRoomModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
            return await this.axiosPostCall(this.getURLwithMainEndPoint('createChatroom'), reqModel, config);
        }

        async getAllUsers(config?: AxiosRequestConfig): Promise<CommonResponse> {
            return await this.axiosPostCall(this.getURLwithMainEndPoint('getAllUsers'), {}, config);
        }

        async sendPrivateMessage(reqModel: PrivateMessegeModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
            return await this.axiosPostCall(this.getURLwithMainEndPoint('privateMessege'), reqModel, config);
        }

        async startCall(reqModel: CallModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
            return await this.axiosPostCall(this.getURLwithMainEndPoint('startAudioCall'), reqModel, config);
        }

        async endCall(reqModel: EndCallModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
            return await this.axiosPostCall(this.getURLwithMainEndPoint('endAudioCall'), reqModel, config);
        }

        async sendAudioMessage(reqModel: AudioMessegeModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
            return await this.axiosPostCall(this.getURLwithMainEndPoint('AudioMessegeModel'), reqModel, config);
        }
    }
