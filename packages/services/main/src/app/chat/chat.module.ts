import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat-gateway';
import { ChatController } from './chat.controller';
import { UserEntity } from '../authentication/entities/user.entity'; 
import { CallEntity } from './entities/call.entity'; 
import { AudioMessageEntity } from './entities/audio.entity';
import { ChatRoomEntity } from './entities/chatroom.entity';
import { MessageEntity } from './entities/messege.entity';
import { ChatRoomRepository } from './repository/chatroom.repository';
import { MessegeRepository } from './repository/messege.repository';
import { UserRepository } from '../authentication/repository/user.repository';
import { CallRepository } from './repository/call.repository';
import { AudioRepository } from './repository/audio.repository';
import { GenericTransactionManager } from 'src/database/trasanction-manager';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatRoomEntity, MessageEntity, UserEntity, CallEntity, AudioMessageEntity]),
  ],
  providers: [ChatService, ChatGateway, ChatRoomRepository, MessegeRepository, UserRepository, CallRepository, AudioRepository, GenericTransactionManager],
  controllers: [ChatController],
})
export class ChatModule {}
