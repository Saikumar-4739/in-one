import { AxiosRequestConfig } from 'axios';
import { CommonAxiosService } from '../common-axios-service';
import { GlobalResponseObject, CreateNoteModel, UpdateNoteModel, GetUserNotesModel, NotesIdRequestModel, CommonResponse, ToggleReactionModel } from '@in-one/shared-models';

export class NotesHelpService extends CommonAxiosService {
  
  private getURLwithMainEndPoint(childUrl: string): string {
    return `/notes/${childUrl}`;
  }

  async createNote(reqModel: CreateNoteModel, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('createNote'), reqModel, config);
  }

  async updateNote(reqModel: UpdateNoteModel, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('updateNote'), reqModel, config);
  }

  async getUserNotes(reqModel: GetUserNotesModel, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('getUserNotes'), reqModel, config);
  }

  async togglePin(id: string, userId: string, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('togglePin'), { id, userId }, config);
  }

  async toggleArchive(id: string, userId: string, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('toggleArchive'), { id, userId }, config);
  }

  async searchNote(userId: string, query: string, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('searchNote'), { userId, query }, config);
  }

  async countUserNotes(userId: string, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('countUserNotes'), { userId }, config);
  }

  async deleteNote(reqModel: NotesIdRequestModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('deleteNote'), reqModel, config);
  }
}