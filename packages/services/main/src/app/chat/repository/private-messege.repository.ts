import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PrivateMessageEntity } from '../entities/private-messege-entity';

@Injectable()
export class PrivateMessageRepository extends Repository<PrivateMessageEntity> {
  constructor(
    @InjectRepository(PrivateMessageEntity)
    private readonly repository: Repository<PrivateMessageEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }
}