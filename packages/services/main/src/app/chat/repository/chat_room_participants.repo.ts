
import { EntityRepository, Repository } from 'typeorm';
import { ChatRoomParticipantEntity } from '../entities/chat.room.participants';

@EntityRepository(ChatRoomParticipantEntity)
export class ChatRoomParticipantRepository extends Repository<ChatRoomParticipantEntity> { }
