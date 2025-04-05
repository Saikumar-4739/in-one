import { IsString } from 'class-validator';

export class PrivateMessageDto {
  @IsString()
  senderId: string;

  @IsString()
  receiverId: string;

  @IsString()
  text: string;
}
