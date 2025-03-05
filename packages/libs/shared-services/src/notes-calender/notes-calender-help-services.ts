import { AxiosRequestConfig } from 'axios';
import { CommonAxiosService } from '../common-axios-service';
import { GlobalResponseObject, CreateCalendarEventModel, CreateCalendarModel, CreateNoteModel, UpdateNoteModel } from '@in-one/shared-models';

export class NotesCalenderHelpService extends CommonAxiosService {
  
  private getURLwithMainEndPoint(childUrl: string): string {
    return `/notes/${childUrl}`; 
  }

  async create(createNoteDto: CreateNoteModel, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('create'), createNoteDto, config);
  }

  async update(id: string, updateNoteDto: UpdateNoteModel, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('update'), { id, ...updateNoteDto }, config);
  }

  async delete(id: string, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('delete'), { id }, config);
  }

  async findAll(userId: string, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('findAll'), { userId }, config);
  }

  async findOne(id: string, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('findOne'), { id }, config);
  }

  async togglePin(id: string, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('togglePin'), { id }, config);
  }

  async toggleArchive(id: string, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('toggleArchive'), { id }, config);
  }

  async search(query: string, userId: string, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('search'), { query, userId }, config);
  }

  async countUserNotes(userId: string, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('countUserNotes'), { userId }, config);
  }

  async createCalendar(calendar: CreateCalendarModel, event: CreateCalendarEventModel, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('createCalendar'), { calendar, event }, config);
  }

  async getAllCalendars(userId: string, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('getAll'), { userId }, config);
  }

  async getCalendarById(id: string, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('getById'), { id }, config);
  }

  async deleteCalendar(id: string, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('delete'), { id }, config);
  }

  async addEvent(calendarId: string, event: CreateCalendarEventModel, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('addEvent'), { calendarId, event }, config);
  }

  async updateEvent(id: string, event: any, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('updateEvent'), { id, event }, config);
  }

  async deleteEvent(id: string, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('deleteEvent'), { id }, config);
  }
}
