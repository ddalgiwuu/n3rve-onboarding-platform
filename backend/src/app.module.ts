import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
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
import { ExternalModule } from './external/external.module';
import { CatalogModule } from './catalog/catalog.module';
import { InboundMailModule } from './inbound-mail/inbound-mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [
        { name: 'short', ttl: 1000, limit: 10 },   // 10 req/sec
        { name: 'medium', ttl: 60000, limit: 100 }, // 100 req/min
      ],
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
    ExternalModule,
    CatalogModule,
    InboundMailModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
