import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserEntity } from 'src/app/authentication/entities/user.entity';
import { CommonResponse, MeetingEventModel } from '@in-one/shared-models';
import { GenericTransactionManager } from 'src/database/trasanction-manager';
import { CalenderRepository } from './repository/calender.repository';
import { CalenderEventRepository } from './repository/calenderevent.repository';
import { google } from 'googleapis';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class CalendarService {
  private readonly googleAuth;

  constructor(
    @InjectRepository(CalenderRepository)
    private readonly calendarRepository: CalenderRepository,
    @InjectRepository(CalenderEventRepository)
    private readonly calendarEventRepository: CalenderEventRepository,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly transactionManager: GenericTransactionManager,
    private readonly mailerService: MailerService,
  ) {
    this.googleAuth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    this.googleAuth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  }

  private async generateGoogleMeetLink(eventDetails: MeetingEventModel): Promise<string> {
    const calendar = google.calendar({ version: 'v3', auth: this.googleAuth });

    const event = {
      summary: eventDetails.title,
      start: { dateTime: eventDetails.startDate, timeZone: 'UTC' },
      end: { dateTime: eventDetails.endDate, timeZone: 'UTC' },
      conferenceData: {
        createRequest: {
          requestId: `${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      conferenceDataVersion: 1,
    });

    const meetLink = response.data.hangoutLink;
    if (!meetLink) {
      throw new Error('Failed to generate Google Meet link');
    }

    return meetLink;
  }

  private async sendMeetingEmails(participants: UserEntity[], meetLink: string, eventDetails: MeetingEventModel) {
    const emailPromises = participants.map(participant =>
      this.mailerService.sendMail({
        to: participant.email,
        subject: `Meeting Invitation: ${eventDetails.title}`,
        html: `
          <h2>${eventDetails.title}</h2>
          <p>Time: ${eventDetails.startDate} - ${eventDetails.endDate}</p>
          <p>Join your Google Meet: <a href="${meetLink}">${meetLink}</a></p>
          <p>Description: ${eventDetails.description || 'No description'}</p>
        `,
      })
    );
    await Promise.all(emailPromises);
  }

  async createEvent(userId: string, eventDto: MeetingEventModel): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) throw new Error('User not found');

      const participants = await this.userRepository.find({
        where: { id: In(eventDto.participantIds) },
      });
      if (participants.length !== eventDto.participantIds.length) {
        throw new Error('One or more participants not found');
      }

      const calendarRepo = this.transactionManager.getRepository(this.calendarRepository);
      let calendar = await calendarRepo.findOne({ where: { user: { id: userId } } });

      if (!calendar) {
        calendar = await calendarRepo.save(calendarRepo.create({ user }));
      }

      const meetLink = await this.generateGoogleMeetLink(eventDto);

      const eventRepo = this.transactionManager.getRepository(this.calendarEventRepository);
      const newEvent = eventRepo.create({
        title: eventDto.title,
        startDate: new Date(eventDto.startDate),
        endDate: new Date(eventDto.endDate),
        description: eventDto.description || '',
        participants: eventDto.participantIds,
        calendar,
        meetLink,
      });

      const savedEvent = await eventRepo.save(newEvent);
      await this.transactionManager.commitTransaction();

      await this.sendMeetingEmails([...participants, user], meetLink, eventDto);

      return new CommonResponse(true, 200, 'Meeting scheduled successfully', {
        ...savedEvent,
        meetLink,
      });
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error scheduling meeting:', error);
      return new CommonResponse(false, 500, 'Error scheduling meeting', error);
    }
  }

  async getUserEvents(userId: string): Promise<CommonResponse> {
    try {
      const calendar = await this.calendarRepository.findOne({
        where: { user: { id: userId } },
        relations: ['events'],
      });

      return new CommonResponse(
        true,
        200,
        'Meetings retrieved successfully',
        calendar?.events.map(event => ({
          ...event,
          meetLink: event.meetLink
        })) || []
      );
    } catch (error) {
      console.error('❌ Error retrieving meetings:', error);
      return new CommonResponse(false, 500, 'Error retrieving meetings');
    }
  }

  async getEventById(id: string): Promise<CommonResponse> {
    try {
      const event = await this.calendarEventRepository.findOne({ where: { id } });
      if (!event) {
        return new CommonResponse(false, 404, 'Meeting not found', null);
      }
      return new CommonResponse(true, 200, 'Meeting retrieved successfully', {
        ...event,
        meetLink: event.meetLink
      });
    } catch (error) {
      console.error('❌ Error retrieving meeting:', error);
      return new CommonResponse(false, 500, 'Error retrieving meeting');
    }
  }

  async updateEvent(id: string, eventDto: Partial<MeetingEventModel>): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const eventRepo = this.transactionManager.getRepository(this.calendarEventRepository);
      const event = await eventRepo.findOne({ where: { id } });

      if (!event) {
        return new CommonResponse(false, 404, 'Meeting not found', null);
      }

      let participants: UserEntity[] = [];
      if (eventDto.participantIds) {
        participants = await this.userRepository.find({
          where: { id: In(eventDto.participantIds) },
        });
        if (participants.length !== eventDto.participantIds.length) {
          throw new Error('One or more participants not found');
        }
      }

      const updatedEventData = {
        ...event,
        ...(eventDto.title && { title: eventDto.title }),
        ...(eventDto.startDate && { startDate: new Date(eventDto.startDate) }),
        ...(eventDto.endDate && { endDate: new Date(eventDto.endDate) }),
        ...(eventDto.description && { description: eventDto.description }),
        ...(eventDto.participantIds && { participants: eventDto.participantIds }),
      };

      const updatedEvent = await eventRepo.save(updatedEventData);
      await this.transactionManager.commitTransaction();

      if (participants.length > 0) {
        const user = await this.userRepository.findOne({ where: { id: updatedEvent.calendar.user.id } });
        if (!user) {
          throw new Error('Event creator not found');
        }
        await this.sendMeetingEmails([...participants, user], updatedEvent.meetLink, {
          title: updatedEvent.title,
          startDate: updatedEvent.startDate.toISOString(),
          endDate: updatedEvent.endDate.toISOString(),
          description: updatedEvent.description,
          participantIds: updatedEvent.participants,
        });
      }

      return new CommonResponse(true, 200, 'Meeting updated successfully', updatedEvent);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error updating meeting:', error);
      return new CommonResponse(false, 500, 'Error updating meeting', error);
    }
  }

  async deleteEvent(id: string): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const eventRepo = this.transactionManager.getRepository(this.calendarEventRepository);
      const event = await eventRepo.findOne({ where: { id } });

      if (!event) {
        return new CommonResponse(false, 404, 'Meeting not found', null);
      }

      await eventRepo.remove(event);
      await this.transactionManager.commitTransaction();

      return new CommonResponse(true, 200, 'Meeting deleted successfully', null);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error deleting meeting:', error);
      return new CommonResponse(false, 500, 'Error deleting meeting', error);
    }
  }
}