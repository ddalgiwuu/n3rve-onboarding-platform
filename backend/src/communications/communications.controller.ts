import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { CommunicationsService } from './communications.service';
import { CreateCommunicationDto } from './dto/create-communication.dto';
import { UpdateCommunicationDto } from './dto/update-communication.dto';
import { ApiKeyAuth } from '../auth/decorators/api-key.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('communications')
export class CommunicationsController {
  constructor(private readonly service: CommunicationsService) {}

  @Post()
  @ApiKeyAuth()
  @Public()
  create(@Body() dto: CreateCommunicationDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(
    @Query('upc') upc?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll({
      upc,
      type,
      status,
      from,
      to,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('stats')
  getStats() {
    return this.service.getStats();
  }

  @Get('by-upc/:upc')
  findByUpc(@Param('upc') upc: string) {
    return this.service.findByUpc(upc);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCommunicationDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
