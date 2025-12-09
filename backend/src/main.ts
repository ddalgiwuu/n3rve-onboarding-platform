import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';
import * as cors from 'cors';

async function bootstrap() {
  // Create app WITH CORS enabled + Express CORS for double coverage
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://n3rve-onboarding.com',
        'http://n3rve-onboarding.com',
        'https://n3rve-onboarding-platform.vercel.app' // Vercel frontend
      ],
      credentials: true,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cache-Control'],
      exposedHeaders: ['Authorization'],
    },
  });

  // Use professional CORS package with debugging
  console.log('Configuring Express CORS with credentials: true');
  app.use(cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://n3rve-onboarding.com',
      'http://n3rve-onboarding.com',
      'https://n3rve-onboarding-platform.vercel.app' // Vercel frontend
    ],
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cache-Control'],
    exposedHeaders: ['Authorization'],
    optionsSuccessStatus: 204,
  }));

  // Add debug middleware to check CORS headers
  app.use((req, res, next) => {
    console.log('✅ Request:', req.method, req.url);
    console.log('✅ Origin:', req.headers.origin);
    
    // Add event listener to check response headers
    const originalSend = res.send;
    res.send = function(body) {
      console.log('✅ Response CORS Headers:');
      console.log('   Access-Control-Allow-Origin:', res.getHeader('Access-Control-Allow-Origin'));
      console.log('   Access-Control-Allow-Credentials:', res.getHeader('Access-Control-Allow-Credentials'));
      console.log('   Access-Control-Allow-Methods:', res.getHeader('Access-Control-Allow-Methods'));
      console.log('   Access-Control-Allow-Headers:', res.getHeader('Access-Control-Allow-Headers'));
      return originalSend.call(this, body);
    };
    
    next();
  });

  // Log environment info for debugging  
  console.log('Starting application with:', {
    NODE_ENV: process.env.NODE_ENV,
    MONGODB_URI: process.env.MONGODB_URI ? 'configured' : 'missing',
    JWT_SECRET: process.env.JWT_SECRET ? 'configured' : 'missing',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'configured' : 'missing',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'configured' : 'missing',
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'not set',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  // Add request logging middleware
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.method === 'POST' || req.method === 'PUT') {
      console.log('Request body:', JSON.stringify(req.body, null, 2));
    }
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    next();
  });

  // Serve static files from uploads directory
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

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