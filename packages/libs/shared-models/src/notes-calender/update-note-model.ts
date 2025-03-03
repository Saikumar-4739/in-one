export class UpdateNoteModel {
    title?: string;
    content?: string;
    attachments?: string[];
    isArchived?: boolean;
    isPinned?: boolean;
    voiceNoteUrl?: string;
    sharedWith?: string[];
  
    constructor(
      title?: string,
      content?: string,
      attachments?: string[],
      isArchived?: boolean,
      isPinned?: boolean,
      voiceNoteUrl?: string,
      sharedWith?: string[]
    ) {
      this.title = title;
      this.content = content;
      this.attachments = attachments;
      this.isArchived = isArchived;
      this.isPinned = isPinned;
      this.voiceNoteUrl = voiceNoteUrl;
      this.sharedWith = sharedWith;
    }
  }
  