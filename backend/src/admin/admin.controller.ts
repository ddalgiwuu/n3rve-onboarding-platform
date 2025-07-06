import { Controller, Get, Post, Body, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async getDashboard(@CurrentUser() user: any) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  async getUsers(@CurrentUser() user: any) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    return this.adminService.getAllUsers();
  }

  @Post('users/:id/toggle-status')
  async toggleUserStatus(
    @CurrentUser() user: any,
    @Param('id') userId: string,
  ) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    return this.adminService.toggleUserStatus(userId);
  }

  @Get('submissions')
  async getSubmissions(@CurrentUser() user: any) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    return this.adminService.getAllSubmissions();
  }

  @Post('submissions/:id/status')
  async updateSubmissionStatus(
    @CurrentUser() user: any,
    @Param('id') submissionId: string,
    @Body('status') status: string,
  ) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    return this.adminService.updateSubmissionStatus(submissionId, status, user.id);
  }
}