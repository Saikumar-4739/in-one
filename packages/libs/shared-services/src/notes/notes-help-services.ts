import { AxiosRequestConfig } from 'axios';
import { CommonAxiosService } from '../common-axios-service';
import { GlobalResponseObject, CreateNoteModel, UpdateNoteModel } from '@in-one/shared-models';

export class NotesHelpService extends CommonAxiosService {
  
  private getURLwithMainEndPoint(childUrl: string): string {
    return `/notes-calender/${childUrl}`;
  }

  async createNote(createNoteDto: CreateNoteModel, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('createNote'), createNoteDto, config);
  }

  async updateNote(id: string, updateNoteDto: UpdateNoteModel, userId: string, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('updateNote'), { id, userId, ...updateNoteDto }, config);
  }

  async getUserNotes(userId: string, includeArchived: boolean = false, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('getUserNotes'), { userId, includeArchived }, config);
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
}