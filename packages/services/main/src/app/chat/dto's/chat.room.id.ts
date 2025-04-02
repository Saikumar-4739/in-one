import { IsString, IsNotEmpty } from 'class-validator';

export class ChatRoomIdRequestModel {
    @IsString()
    @IsNotEmpty()
    chatRoomId: string;

    constructor(chatRoomId: string) {
        this.chatRoomId = chatRoomId;
    }
}
