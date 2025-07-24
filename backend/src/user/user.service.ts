import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getAccountInfo(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        company: true,
        isCompanyAccount: true,
        parentAccountId: true,
        parentAccount: {
          select: {
            id: true,
            name: true,
            company: true,
          },
        },
        subAccounts: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            subAccounts: true,
            submissions: true,
          },
        },
      },
    });
  }

  async getSubAccounts(userId: string) {
    return this.prisma.user.findMany({
      where: {
        parentAccountId: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });
  }

  async createSubAccount(
    parentAccountId: string,
    createSubAccountDto: {
      name: string;
      email: string;
      password: string;
      role?: string;
    },
  ) {
    const parentAccount = await this.prisma.user.findUnique({
      where: { id: parentAccountId },
      select: { company: true },
    });

    const hashedPassword = await bcrypt.hash(createSubAccountDto.password, 10);

    return this.prisma.user.create({
      data: {
        name: createSubAccountDto.name,
        email: createSubAccountDto.email,
        password: hashedPassword,
        role: (createSubAccountDto.role?.toUpperCase() || 'USER') as 'USER' | 'ADMIN',
        provider: 'EMAIL',
        isProfileComplete: true,
        parentAccountId,
        company: parentAccount?.company,
        preferences: {
          language: 'KO',
          notifications: {
            email: true,
            sms: false,
            push: true,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  }

  async upgradeToCompanyAccount(userId: string, company: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isCompanyAccount: true,
        company,
      },
      include: {
        subAccounts: true,
      },
    });
  }
}