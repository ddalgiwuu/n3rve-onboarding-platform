import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { SubmissionsModule } from './submissions/submissions.module';
import { AdminModule } from './admin/admin.module';
import { FilesModule } from './files/files.module';
import { HealthModule } from './health/health.module';
import { WebsocketModule } from './websocket/websocket.module';
import { SavedArtistsModule } from './saved-artists/saved-artists.module';
import { DSPModule } from './dsp/dsp.module';
import { DropboxModule } from './dropbox/dropbox.module';
import { UserModule } from './user/user.module';
import { DigitalProductsModule } from './digital-products/digital-products.module';
import { FeatureReportsModule } from './feature-reports/feature-reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    SubmissionsModule,
    AdminModule,
    FilesModule,
    HealthModule,
    WebsocketModule,
    SavedArtistsModule,
    DSPModule,
    DropboxModule,
    UserModule,
    DigitalProductsModule,
    FeatureReportsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
