import { PartialType } from '@nestjs/mapped-types';
import { CreateDigitalProductDto } from './create-digital-product.dto';

export class UpdateDigitalProductDto extends PartialType(CreateDigitalProductDto) {}
