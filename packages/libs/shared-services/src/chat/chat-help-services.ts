import { AxiosRequestConfig } from 'axios';
import { CommonAxiosService } from '../common-axios-service';
import {
  CommonResponse,
  CreateChatRoomModel,
  CreateMessageModel,
  EditMessageModel,
  ChatRoomIdRequestModel,
  MessegeIdRequestModel,
  UserIdRequestModel,
  PrivateMessegeModel,
} from '@in-one/shared-models';

type RTCSdpType = 'offer' | 'answer' | 'pranswer' | 'rollback';

type RTCSessionDescriptionInit = {
  type?: RTCSdpType;
  sdp?: string;
};

type RTCIceCandidateInit = {
  candidate?: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
};

export class ChatHelpService extends CommonAxiosService {
  private getURLwithMainEndPoint(childUrl: string): string {
    return `/chat/${childUrl}`;
  }

  async sendMessage(reqModel: CreateMessageModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('sendMessage'), reqModel, config);
  }

  async sendPrivateMessage(reqModel: PrivateMessegeModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('sendPrivateMessage'), reqModel, config);
  }

  async getMessages(reqModel: ChatRoomIdRequestModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('getAllMessages'), reqModel, config);
  }

  async getPrivateChatHistory(reqModel: { senderId: string; receiverId: string }, config?: AxiosRequestConfig): Promise<CommonResponse> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('getPrivateChatHistory'), reqModel, config);
  }

  async editMessage(reqModel: EditMessageModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('editMessage'), reqModel, config);
  }

  async editPrivateMessage(reqModel: EditMessageModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('editPrivateMessage'), reqModel, config);
  }

  async deleteMessage(reqModel: MessegeIdRequestModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('deleteMessage'), reqModel, config);
  }

  async deletePrivateMessage(reqModel: MessegeIdRequestModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('deletePrivateMessage'), reqModel, config);
  }

  async getMessageById(reqModel: MessegeIdRequestModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('getMessageById'), reqModel, config);
  }

  async getPrivateMessageById(reqModel: MessegeIdRequestModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('getPrivateMessageById'), reqModel, config);
  }

  async getChatRooms(reqModel: UserIdRequestModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('getChatRooms'), reqModel, config);
  }

  async createChatRoom(reqModel: CreateChatRoomModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('createChatRoom'), reqModel, config);
  }

  async getAllUsers(config?: AxiosRequestConfig): Promise<CommonResponse> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('getAllUsers'), {}, config);
  }

  async initiateCall(reqModel: { callerId: string; userToCall: string; signalData: RTCSessionDescriptionInit }, config?: AxiosRequestConfig): Promise<CommonResponse> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('initiateCall'), reqModel, config);
  }

  async answerCall(reqModel: { callId: string; signalData: RTCSessionDescriptionInit; answererId: string }, config?: AxiosRequestConfig): Promise<CommonResponse> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('answerCall'), reqModel, config);
  }

  async handleIceCandidate(reqModel: { callId: string; candidate: RTCIceCandidateInit; userId: string }, config?: AxiosRequestConfig): Promise<CommonResponse> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('iceCandidate'), reqModel, config);
  }

  async endCall(reqModel: { callId: string; userId: string }, config?: AxiosRequestConfig): Promise<CommonResponse> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('endCall'), reqModel, config);
  }
}