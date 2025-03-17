export class CreateCalendarEventModel {
  calendarId: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  reminder?: Date;
  isAllDay?: boolean;
  participants?: string[];
  isRecurring?: boolean;
  recurringRule?: any;
  status?: 'upcoming' | 'completed' | 'cancelled';
  
    constructor(
      title: string,
      description: string = '',
      startDate: Date,
      endDate: Date,
      location: string = '',
      reminder: Date,
      isAllDay: boolean = false,
      participants: string[] = [],
      isRecurring: boolean = false,
      recurringRule: string | null = null,
      calendarId: string,
      status?: 'upcoming' | 'completed' | 'cancelled',
    ) {
      this.title = title;
      this.description = description;
      this.startDate = startDate;
      this.endDate = endDate;
      this.location = location;
      this.reminder = reminder;
      this.isAllDay = isAllDay;
      this.participants = participants;
      this.isRecurring = isRecurring;
      this.recurringRule = recurringRule;
      this.calendarId = calendarId;
      this.status = status;
    }
  }
  