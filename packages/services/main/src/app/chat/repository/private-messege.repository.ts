import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { PrivateMessageEntity } from '../entities/private-messege-entity';

@Injectable()
export class PrivateMessageRepository extends Repository<PrivateMessageEntity> {
    constructor(private dataSource: DataSource) {
        super(PrivateMessageEntity, dataSource.createEntityManager());
    }
}