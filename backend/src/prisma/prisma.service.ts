import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ Successfully connected to MongoDB');
      
      // Test the connection
      // const result = await this.$runCommandRaw({ ping: 1 });
      // console.log('✅ MongoDB ping successful:', result);
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      console.error('MongoDB URI:', process.env.MONGODB_URI ? 'configured' : 'missing');
      // Don't throw error to allow app to start without database
      console.log('⚠️  Continuing without database connection...');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
  
  // Health check query
  async executeRawQuery(query: string) {
    // For MongoDB, we use the underlying MongoDB client
    return this.$runCommandRaw({ ping: 1 });
  }
}