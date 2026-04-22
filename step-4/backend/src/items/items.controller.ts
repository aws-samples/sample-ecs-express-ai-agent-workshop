import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateItemDto } from './dto/create-item.dto';
import { ItemEntity } from './entities/item.entity';
import { ItemsService } from './items.service';

@ApiTags('items')
@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  @ApiOperation({ summary: 'Create an item' })
  @ApiResponse({ status: 201, type: ItemEntity })
  create(@Body() dto: CreateItemDto): Promise<ItemEntity> {
    return this.itemsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all items' })
  @ApiResponse({ status: 200, type: [ItemEntity] })
  findAll(): Promise<ItemEntity[]> {
    return this.itemsService.findAll();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an item' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 204, description: 'Item deleted' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  remove(@Param('id') id: string): Promise<ItemEntity> {
    return this.itemsService.remove(id);
  }
}
