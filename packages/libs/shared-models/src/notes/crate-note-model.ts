export class CreateNoteModel {
  title: string;
  content: string;
  userId: string;
  color: string;
  tags?: string[];
  reminderAt?: Date;
  constructor(
    title: string,
    content: string,
    userId: string,
    color: string,
    tags?: string[],
    reminderAt?: Date
  ) {
    this.title = title;
    this.content = content;
    this.userId = userId;
    this.color = color;
    this.tags = tags;
    this.reminderAt = reminderAt
  }
}
