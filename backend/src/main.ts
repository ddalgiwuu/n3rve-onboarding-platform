import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';
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



  // Security headers
  app.use(helmet());

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

  // Serve static files from uploads directory (with basic auth check)
  app.use('/uploads', (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    next();
  }, express.static(join(__dirname, '..', 'uploads')));

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