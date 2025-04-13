export class CreateNoteModel {
  title: string;
  content: string;
  userId: string;
  attachments?: string[];
  isArchived?: boolean;
  isPinned?: boolean;
  voiceNoteUrl?: string;
  sharedWith?: string[];
  color?: string;

  constructor(
    title: string,
    content: string,
    userId: string,
    attachments?: string[],
    isArchived?: boolean,
    isPinned?: boolean,
    voiceNoteUrl?: string,
    sharedWith?: string[],
    color?: string
  ) {
    this.title = title;
    this.content = content;
    this.userId = userId;
    this.attachments = attachments;
    this.isArchived = isArchived;
    this.isPinned = isPinned;
    this.voiceNoteUrl = voiceNoteUrl;
    this.sharedWith = sharedWith;
    this.color = color
  }
}
