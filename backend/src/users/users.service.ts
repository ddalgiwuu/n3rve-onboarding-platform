import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(data: any) {
    const { preferences, ...rest } = data;
    return this.prisma.user.create({
      data: {
        ...rest,
        preferences: preferences || {
          language: 'KO',
          notifications: {
            email: true,
            sms: false,
            push: true,
          },
        },
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async findUserByEmail(email: string) {
    return this.findOne(email);
  }

  async findUserById(id: string) {
    return this.findById(id);
  }

  async findUserByGoogleId(googleId: string) {
    return this.prisma.user.findUnique({
      where: { googleId },
    });
  }

  async createUser(data: any) {
    return this.create(data);
  }

  async updateUser(id: string, data: any) {
    return this.update(id, data);
  }

  async updateLastLogin(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        lastLogin: new Date(),
      },
    });
  }
}