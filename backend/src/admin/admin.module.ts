import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminAccountsController } from './admin-accounts.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SubmissionsModule } from '../submissions/submissions.module';
import { UsersModule } from '../users/users.module';
import { DropboxModule } from '../dropbox/dropbox.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { CatalogModule } from '../catalog/catalog.module';

@Module({
  imports: [
    PrismaModule,
    SubmissionsModule,
    UsersModule,
    DropboxModule,
    WebsocketModule,
    CatalogModule,
  ],
  controllers: [AdminController, AdminAccountsController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}