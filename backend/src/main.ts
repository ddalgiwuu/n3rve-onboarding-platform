import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cors from 'cors';
import helmet from 'helmet';

async function bootstrap() {

  // Create app WITH CORS enabled + Express CORS for double coverage
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://n3rve-onboarding.com',
        'https://n3rve-onboarding-platform.vercel.app',
      ],
      credentials: true,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cache-Control'],
      exposedHeaders: ['Authorization'],
    },
  });

  app.use(cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://n3rve-onboarding.com',
      'https://n3rve-onboarding-platform.vercel.app',
    ],
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cache-Control'],
    exposedHeaders: ['Authorization'],
    optionsSuccessStatus: 204,
  }));



  // Security headers (allow Dropbox media/images)
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:", "https://*.dropbox.com", "https://*.dropboxusercontent.com", "https://dl.dropboxusercontent.com"],
        mediaSrc: ["'self'", "blob:", "https://*.dropbox.com", "https://*.dropboxusercontent.com", "https://dl.dropboxusercontent.com"],
        connectSrc: ["'self'", "https://*.dropbox.com", "https://*.dropboxusercontent.com", "https://n3rve-backend.fly.dev", "wss://n3rve-onboarding.com"],
        fontSrc: ["'self'", "data:"],
        frameSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Required for Dropbox media
  }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  // Request logging - method and URL only (no body/headers in production)
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Static /uploads serving removed: files are served from Dropbox.

  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0'); // Listen on all interfaces for Fly.io
  console.log(`Application is running on: ${await app.getUrl()}`);

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    await app.close();
    process.exit(0);
  });
}
void bootstrap();