import { AxiosRequestConfig } from 'axios';
import { CommonAxiosService } from '../common-axios-service';
import { GlobalResponseObject, CreateNoteModel, UpdateNoteModel, MeetingEventModel } from '@in-one/shared-models';

export class NotesCalenderHelpService extends CommonAxiosService {
  
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

  async createEvent(userId: string, event: MeetingEventModel, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('createEvent'), { userId, event }, config);
  }

  async getUserEvents(userId: string, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('getUserEvents'), { userId }, config);
  }

  async getEventById(id: string, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('getEventById'), { id }, config);
  }

  async deleteEvent(id: string, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('deleteEvent'), { id }, config);
  }

  async updateEvent(id: string, event: Partial<MeetingEventModel>, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('updateEvent'), { id, event }, config);
  }
}