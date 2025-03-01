import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from 'src/database/database.module';
import { UserModule } from './authentication/user.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    DatabaseModule,
    UserModule,
    ChatModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
