import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from '@/common/config/app-config.module';
import { DatabaseModule } from '@/common/database/database.module';
import { ConversationsModule } from '@/modules/conversations/conversations.module';

@Module({
  imports: [AppConfigModule, DatabaseModule, ConversationsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
