import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards
} from '@nestjs/common';
import { DigitalProductsService } from './digital-products.service';
import { CreateDigitalProductDto } from './dto/create-digital-product.dto';
import { UpdateDigitalProductDto } from './dto/update-digital-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Role } from '@prisma/client';

@Controller('digital-products')
@UseGuards(JwtAuthGuard)
export class DigitalProductsController {
  constructor(private readonly digitalProductsService: DigitalProductsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  create(@Body() createDto: CreateDigitalProductDto) {
    return this.digitalProductsService.create(createDto);
  }

  @Get()
  findAll(
    @Query('userId') userId?: string,
    @Query('submissionId') submissionId?: string,
    @CurrentUser() user?: any
  ) {
    // Non-admin users can only see their own products
    const currentUserId = user?.id;
    return this.digitalProductsService.findAll(userId || currentUserId, submissionId);
  }

  @Get('upc/:upc')
  findByUPC(@Param('upc') upc: string) {
    return this.digitalProductsService.findByUPC(upc);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.digitalProductsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  update(@Param('id') id: string, @Body() updateDto: UpdateDigitalProductDto) {
    return this.digitalProductsService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.digitalProductsService.remove(id);
  }

  @Post('from-submission/:submissionId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  createFromSubmission(@Param('submissionId') submissionId: string) {
    return this.digitalProductsService.createFromSubmission(submissionId);
  }
}
