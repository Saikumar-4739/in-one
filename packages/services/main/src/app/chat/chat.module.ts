import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat-gateway';
import { ChatController } from './chat.controller';
import { UserEntity } from '../user/entities/user.entity';
import { CallEntity } from './entities/call.entity';
import { ChatRoomEntity } from './entities/chatroom.entity';
import { MessageEntity } from './entities/messege.entity';
import { ChatRoomRepository } from './repository/chatroom.repository';
import { MessegeRepository } from './repository/messege.repository';
import { UserRepository } from '../user/repository/user.repository';
import { CallRepository } from './repository/call.repository';
import { GenericTransactionManager } from 'src/database/trasanction-manager';
import { ChatRoomParticipantRepository } from './repository/chat_room_participants.repo';

@Module({
  imports: [TypeOrmModule.forFeature([ChatRoomEntity, MessageEntity, UserEntity, CallEntity])],
  providers: [ChatService, ChatGateway, ChatRoomRepository, MessegeRepository, UserRepository, CallRepository, GenericTransactionManager, ChatRoomParticipantRepository],
  controllers: [ChatController],
})
export class ChatModule { }
