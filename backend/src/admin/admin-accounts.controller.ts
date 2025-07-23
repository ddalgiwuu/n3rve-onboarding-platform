import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

interface CreateAccountDto {
  email: string;
  name: string;
  password: string;
  role: 'ADMIN' | 'CUSTOMER';
  companyName?: string;
  isCompanyAccount?: boolean;
}

interface CreateSubAccountDto {
  email: string;
  name: string;
  password: string;
  parentAccountId: string;
}

@Controller('admin/accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminAccountsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getAccounts() {
    try {
      const accounts = await this.prisma.user.findMany({
        where: {
          role: {
            in: ['ADMIN', 'CUSTOMER', 'SUB_ACCOUNT', 'USER'],
          },
        },
        include: {
          subAccounts: true,
          parentAccount: {
            select: {
              id: true,
              name: true,
              company: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Transform role from USER to CUSTOMER for display
      return accounts.map(account => ({
        ...account,
        role: account.role === 'USER' ? 'CUSTOMER' : account.role,
        companyName: account.company,
      }));
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw new HttpException(
        'Failed to fetch accounts',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async createAccount(@Body() dto: CreateAccountDto) {
    try {
      // Check if email already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new HttpException(
          'Email already exists',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          password: hashedPassword,
          role: dto.role === 'CUSTOMER' ? 'USER' : dto.role,
          provider: 'EMAIL',
          company: dto.companyName,
          isCompanyAccount: dto.isCompanyAccount || false,
          emailVerified: true,
          isActive: true,
          preferences: {
            language: 'KO',
            notifications: {
              email: true,
              sms: false,
              push: true,
            },
          },
        },
      });

      return {
        ...user,
        role: user.role === 'USER' ? 'CUSTOMER' : user.role,
      };
    } catch (error) {
      console.error('Error creating account:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to create account',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('sub-account')
  async createSubAccount(@Body() dto: CreateSubAccountDto) {
    try {
      // Check if parent account exists and is a company account
      const parentAccount = await this.prisma.user.findUnique({
        where: { id: dto.parentAccountId },
      });

      if (!parentAccount) {
        throw new HttpException(
          'Parent account not found',
          HttpStatus.NOT_FOUND,
        );
      }

      if (!parentAccount.isCompanyAccount) {
        throw new HttpException(
          'Parent account is not a company account',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Check if email already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new HttpException(
          'Email already exists',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      // Create sub-account
      const subAccount = await this.prisma.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          password: hashedPassword,
          role: 'SUB_ACCOUNT',
          provider: 'EMAIL',
          parentAccountId: dto.parentAccountId,
          company: parentAccount.company,
          emailVerified: true,
          isActive: true,
          preferences: {
            language: 'KO',
            notifications: {
              email: true,
              sms: false,
              push: true,
            },
          },
        },
      });

      return subAccount;
    } catch (error) {
      console.error('Error creating sub-account:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to create sub-account',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async deleteAccount(@Param('id') id: string) {
    try {
      // Check if account has sub-accounts
      const account = await this.prisma.user.findUnique({
        where: { id },
        include: {
          subAccounts: true,
        },
      });

      if (!account) {
        throw new HttpException(
          'Account not found',
          HttpStatus.NOT_FOUND,
        );
      }

      if (account.subAccounts && account.subAccounts.length > 0) {
        // Delete all sub-accounts first
        await this.prisma.user.deleteMany({
          where: {
            parentAccountId: id,
          },
        });
      }

      // Delete the account
      await this.prisma.user.delete({
        where: { id },
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting account:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to delete account',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}