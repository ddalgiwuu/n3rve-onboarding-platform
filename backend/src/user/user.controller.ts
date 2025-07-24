import { Controller, Get, Post, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('account-info')
  async getAccountInfo(@CurrentUser() user: any) {
    return this.userService.getAccountInfo(user.id);
  }

  @Get('sub-accounts')
  async getSubAccounts(@CurrentUser() user: any) {
    if (!user.isCompanyAccount) {
      throw new ForbiddenException('Only company accounts can have sub-accounts');
    }
    return this.userService.getSubAccounts(user.id);
  }

  @Post('sub-accounts')
  async createSubAccount(
    @CurrentUser() user: any,
    @Body() createSubAccountDto: {
      name: string;
      email: string;
      password: string;
      role?: string;
    },
  ) {
    if (!user.isCompanyAccount) {
      throw new ForbiddenException('Only company accounts can create sub-accounts');
    }
    return this.userService.createSubAccount(user.id, createSubAccountDto);
  }

  @Post('upgrade-to-company')
  async upgradeToCompanyAccount(
    @CurrentUser() user: any,
    @Body() upgradeDto: {
      company: string;
    },
  ) {
    if (user.isCompanyAccount) {
      throw new ForbiddenException('Account is already a company account');
    }
    if (user.parentAccountId) {
      throw new ForbiddenException('Sub-accounts cannot be upgraded to company accounts');
    }
    return this.userService.upgradeToCompanyAccount(user.id, upgradeDto.company);
  }
}