import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { PhotoEntity } from "../entities/photo.entity";

@Injectable()
export class PhotoRepository extends Repository<PhotoEntity> {
  constructor(private dataSource: DataSource) {
    super(PhotoEntity, dataSource.createEntityManager());
  }
}
