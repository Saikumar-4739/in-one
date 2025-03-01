import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat-gateway';
import { ChatRoom, ChatRoomSchema } from './schema/chat-room.schema';
import { MessageEntity, MessageSchema } from './schema/message.schema';
import { ChatController } from './chat.controller';
import { UserEntity, UserSchema } from '../authentication/schema/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ChatRoom.name, schema: ChatRoomSchema }]),
    MongooseModule.forFeature([{ name: MessageEntity.name, schema: MessageSchema }]),
    MongooseModule.forFeature([{ name: UserEntity.name, schema: UserSchema }]),
  ],
  providers: [ChatService, ChatGateway],
  controllers: [ChatController]
})


export class ChatModule {}