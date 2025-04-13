import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { UserEntity } from "../entities/user.entity";

@Injectable()
export class UserRepository extends Repository<UserEntity> {
  constructor(private dataSource: DataSource) {
    super(UserEntity, dataSource.createEntityManager());
  }

  async findByIdWithPreferences(userId: string): Promise<UserEntity | null> {
    return this.findOne({ where: { id: userId }, select: ['id', 'role', 'screenPreferences'] });
  }
}
