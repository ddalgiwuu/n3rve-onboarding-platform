import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminAccountsController } from './admin-accounts.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SubmissionsModule } from '../submissions/submissions.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, SubmissionsModule, UsersModule],
  controllers: [AdminController, AdminAccountsController],
  providers: [AdminService],
})
export class AdminModule {}