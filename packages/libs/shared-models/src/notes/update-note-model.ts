import { NotesIdRequestModel } from "./notes-id-request-model";

export class UpdateNoteModel  extends NotesIdRequestModel {
  userId: string
  title: string;
  content: string;
  color: string;
  tags?: string[];
  reminderAt?: Date;

  constructor(
    noteId: string,
    userId: string,
    title: string,
    content: string,
    color: string,
    tags?: string[],
    reminderAt?: Date
  ) {
    super(noteId)
    this.userId = userId
    this.title = title;
    this.content = content;
    this.color = color;
    this.tags = tags;
    this.reminderAt = reminderAt
  }
}
