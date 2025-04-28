// @in-one/shared-models/messege-response-model.ts
export class MessageResponseModel {
    _id: string;
    senderId: string;
    chatRoomId?: string; // Made optional for private messages
    text: string | null; // Allow null to match entity
    createdAt: Date;
    receiverId?: string; // Already optional, used for private messages
    emoji?: string;
    fileUrl?: string;
    fileType?: string;
    status?: 'pending' | 'delivered' | 'read' | 'failed';
  
    constructor(
      _id: string,
      senderId: string,
      text: string | null,
      createdAt: Date,
      chatRoomId?: string,
      receiverId?: string,
      emoji?: string,
      fileUrl?: string,
      fileType?: string,
      status?: 'pending' | 'delivered' | 'read' | 'failed'
    ) {
      this._id = _id;
      this.senderId = senderId;
      this.chatRoomId = chatRoomId;
      this.text = text;
      this.createdAt = createdAt;
      this.receiverId = receiverId;
      this.emoji = emoji;
      this.fileUrl = fileUrl;
      this.fileType = fileType;
      this.status = status;
    }
  }