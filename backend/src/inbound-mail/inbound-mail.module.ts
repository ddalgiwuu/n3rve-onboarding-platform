import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GmailImapService } from './gmail-imap.service';
import { EmailParserService } from './email-parser.service';
import { AdminModule } from '../admin/admin.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ConfigModule, AdminModule, PrismaModule],
  providers: [GmailImapService, EmailParserService],
  exports: [GmailImapService],
})
export class InboundMailModule {}
