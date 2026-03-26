import { Controller, Get, Post, Body, Param, UseGuards, ForbiddenException, Query, Patch, Delete } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateQCLogDto } from './dto/create-qc-log.dto';
import { CreateDSPOverrideDto } from './dto/create-dsp-override.dto';

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
      company?: string;
      isCompanyAccount?: boolean;
      parentAccountId?: string;
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

  @Post('submissions/mark-catalog-released')
  async markCatalogReleased(@CurrentUser() user: any) {
    if (user.role !== 'ADMIN') throw new ForbiddenException();
    return this.adminService.markCatalogSubmissionsReleased();
  }

  @Post('submissions/update-files')
  @Public()
  async updateSubmissionFiles(@Body() body: { fileLinks: Record<string, any> }) {
    return this.adminService.updateSubmissionFiles(body.fileLinks);
  }

  @Get('submissions/sync-diagnostic')
  async syncDiagnostic(@CurrentUser() user: any) {
    if (user.role !== 'ADMIN') throw new ForbiddenException();
    return this.adminService.diagnoseSyncMismatches();
  }

  @Post('submissions/auto-sync-fix')
  async autoSyncFix(@CurrentUser() user: any) {
    if (user.role !== 'ADMIN') throw new ForbiddenException();
    return this.adminService.autoFixSyncMismatches();
  }

  @Post('submissions/auto-map-labels')
  async autoMapLabels(@CurrentUser() user: any) {
    if (user.role !== 'ADMIN') throw new ForbiddenException();
    return this.adminService.autoMapLabelAccounts();
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

  @Get('submissions/:id/qc-logs')
  async getQCLogs(
    @CurrentUser() user: any,
    @Param('id') submissionId: string,
    @Query('source') source?: string,
    @Query('severity') severity?: string,
    @Query('status') status?: string,
    @Query('dsp') dsp?: string,
  ) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    return this.adminService.getQCLogs(submissionId, { source, severity, status, dsp });
  }

  @Post('submissions/:id/qc-logs')
  async createQCLog(
    @CurrentUser() user: any,
    @Param('id') submissionId: string,
    @Body() body: CreateQCLogDto,
  ) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    return this.adminService.createQCLog(submissionId, body, user.id);
  }

  @Patch('qc-logs/:logId/status')
  async updateQCLogStatus(
    @CurrentUser() user: any,
    @Param('logId') logId: string,
    @Body() body: { status: string; resolvedBy?: string },
  ) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    return this.adminService.updateQCLogStatus(logId, body.status, body.resolvedBy);
  }

  @Get('submissions/:id/dsp-overrides')
  async getDSPOverrides(
    @CurrentUser() user: any,
    @Param('id') submissionId: string,
    @Query('dsp') dsp?: string,
  ) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    return this.adminService.getDSPOverrides(submissionId, dsp);
  }

  @Patch('submissions/:id/label-account')
  async assignLabelAccount(
    @Param('id') id: string,
    @Body() body: { labelAccountId: string | null },
    @CurrentUser() user: any,
  ) {
    if (user.role !== 'ADMIN') throw new ForbiddenException();
    return this.adminService.assignLabelAccount(id, body.labelAccountId);
  }

  @Get('label-accounts')
  async getLabelAccounts(@CurrentUser() user: any) {
    if (user.role !== 'ADMIN') throw new ForbiddenException();
    return this.adminService.getLabelAccounts();
  }

  @Get('label-accounts/:id/submissions')
  async getSubmissionsByLabel(@Param('id') id: string, @CurrentUser() user: any) {
    if (user.role !== 'ADMIN') throw new ForbiddenException();
    return this.adminService.getSubmissionsByLabel(id);
  }

  @Delete('submissions/:id')
  async deleteSubmission(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    await this.adminService.deleteSubmission(id);
    return { message: 'Submission deleted successfully' };
  }

  @Post('submissions/:id/dsp-overrides')
  async createDSPOverride(
    @CurrentUser() user: any,
    @Param('id') submissionId: string,
    @Body() body: CreateDSPOverrideDto,
  ) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    return this.adminService.createDSPOverride(submissionId, body, user.id);
  }
}