export class CreateCalendarEventModel {
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    location: string;
    reminder: Date | null;
    isAllDay: boolean;
    participants: string[];
    isRecurring: boolean;
    recurringRule: string | null;
    status: string;
    calendarId: string;
  
    constructor(
      title: string,
      description: string = '',
      startDate: Date,
      endDate: Date,
      location: string = '',
      reminder: Date | null = null,
      isAllDay: boolean = false,
      participants: string[] = [],
      isRecurring: boolean = false,
      recurringRule: string | null = null,
      status: string = 'upcoming',
      calendarId: string,
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
      this.status = status;
      this.calendarId = calendarId;
    }
  }
  