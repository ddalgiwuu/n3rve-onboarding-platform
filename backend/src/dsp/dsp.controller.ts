import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseBoolPipe,
  ParseIntPipe,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DSPService, CreateDSPDto, UpdateDSPDto } from './dsp.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ServiceType } from '@prisma/client';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('dsp')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dsp')
export class DSPController {
  constructor(private readonly dspService: DSPService) {}

  @Get()
  @ApiOperation({ summary: 'Get all DSPs with optional filtering' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'serviceType', required: false, enum: ServiceType })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 100 })
  @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
  async findAll(
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('serviceType') serviceType?: ServiceType,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const isActiveBoolean = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    
    return this.dspService.findAll(
      search,
      isActiveBoolean,
      serviceType,
      limit ? parseInt(limit) : 100,
      offset ? parseInt(offset) : 0
    );
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get DSP statistics' })
  async getStatistics() {
    return this.dspService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single DSP by ID' })
  async findOne(@Param('id') id: string) {
    const dsp = await this.dspService.findOne(id);
    if (!dsp) {
      throw new HttpException('DSP not found', HttpStatus.NOT_FOUND);
    }
    return dsp;
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new DSP (Admin only)' })
  async create(@Body() createDSPDto: CreateDSPDto) {
    try {
      return await this.dspService.create(createDSPDto);
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new HttpException('DSP with this ID already exists', HttpStatus.CONFLICT);
      }
      throw error;
    }
  }

  @Post('bulk')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Bulk create/update DSPs (Admin only)' })
  async bulkUpsert(@Body() dsps: CreateDSPDto[]) {
    return this.dspService.bulkUpsert(dsps);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a DSP (Admin only)' })
  async update(@Param('id') id: string, @Body() updateDSPDto: UpdateDSPDto) {
    const dsp = await this.dspService.update(id, updateDSPDto);
    if (!dsp) {
      throw new HttpException('DSP not found', HttpStatus.NOT_FOUND);
    }
    return dsp;
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a DSP (soft delete, Admin only)' })
  async delete(@Param('id') id: string) {
    const dsp = await this.dspService.delete(id);
    if (!dsp) {
      throw new HttpException('DSP not found', HttpStatus.NOT_FOUND);
    }
    return { message: 'DSP deactivated successfully' };
  }
}