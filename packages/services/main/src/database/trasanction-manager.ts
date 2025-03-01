import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ClientSession, Model } from 'mongoose';

export interface ITransactionHelper {
  startTransaction(): void;
  completeTransaction(work: () => Promise<void>): Promise<void>;
  getRepository<T>(entity: Model<T>): Model<T>;
}

@Injectable()
export class GenericTransactionManager implements ITransactionHelper {
  private session: ClientSession;

  constructor(@InjectConnection() private readonly connection: Connection) {}

  async startTransaction() {
    this.session = await this.connection.startSession();
    this.session.startTransaction();
  }

  getSession(): ClientSession {
    if (!this.session) {
      throw new Error('Transaction session not started. Please call startTransaction() first.');
    }
    return this.session;
  }

  async commitTransaction() {
    if (!this.session) {
      throw new Error('Transaction session not started. Please call startTransaction() first.');
    }
    try {
      await this.session.commitTransaction();
    } catch (error) {
      await this.session.abortTransaction();
      throw error; 
    } finally {
      await this.session.endSession();
    }
  }

  async rollbackTransaction() {
    if (!this.session) {
      throw new Error('Transaction session not started. Please call startTransaction() first.');
    }
    await this.session.abortTransaction();
    await this.session.endSession();
  }

  getRepository<T>(entity: Model<T>): Model<T> {
    if (!this.session) {
      throw new Error('Transaction session not started. Please call startTransaction() first.');
    }
    return entity; 
  }

  async completeTransaction(work: () => Promise<void>): Promise<void> {
    try {
      await work(); 
      await this.commitTransaction(); 
    } catch (error) {
      await this.rollbackTransaction(); 
      throw error; 
    }
  }
}
