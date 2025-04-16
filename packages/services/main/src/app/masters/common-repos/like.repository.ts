import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { LikeEntity } from '../common-entities/like.entity';

@Injectable()
export class LikeRepository extends Repository<LikeEntity> {
  constructor(private dataSource: DataSource) {
    super(LikeEntity, dataSource.createEntityManager());
  }
}