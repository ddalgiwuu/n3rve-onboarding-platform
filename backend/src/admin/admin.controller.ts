import { Controller, Get, Post, Body, Param, UseGuards, ForbiddenException, Query, Patch } from '@nestjs/common';
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

  @Get('dashboard/stats')
  async getDashboardStats(@CurrentUser() user: any) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  async getUsers(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    return this.adminService.getAllUsers({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      search,
      status,
    });
  }

  @Get('users/stats')
  async getUserStats(@CurrentUser() user: any) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    return this.adminService.getUserStats();
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

  @Patch('users/:id/role')
  async updateUserRole(
    @CurrentUser() user: any,
    @Param('id') userId: string,
    @Body('role') role: string,
  ) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    return this.adminService.updateUserRole(userId, role);
  }

  @Post('users')
  async createUser(
    @CurrentUser() user: any,
    @Body() createUserDto: {
      name: string;
      email: string;
      password: string;
      role: string;
    },
  ) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    return this.adminService.createUser(createUserDto);
  }

  @Get('submissions')
  async getSubmissions(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    return this.adminService.getAllSubmissions({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      status,
      search,
      startDate,
      endDate,
    });
  }

  @Get('submissions/stats')
  async getSubmissionStats(@CurrentUser() user: any) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    return this.adminService.getSubmissionStats();
  }

  @Get('submissions/:id')
  async getSubmissionById(
    @CurrentUser() user: any,
    @Param('id') submissionId: string,
  ) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    return this.adminService.getSubmissionById(submissionId);
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

  @Patch('submissions/:id/status')
  async patchSubmissionStatus(
    @CurrentUser() user: any,
    @Param('id') submissionId: string,
    @Body() body: { status: string; adminNotes?: string },
  ) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    return this.adminService.updateSubmissionStatus(submissionId, body.status, user.id, body.adminNotes);
  }
}