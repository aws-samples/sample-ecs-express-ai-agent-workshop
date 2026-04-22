import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateItemDto } from './dto/create-item.dto';
import { ItemEntity } from './entities/item.entity';
import { ItemsService } from './items.service';

@ApiTags('items')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  @ApiOperation({ summary: 'Create an item' })
  @ApiResponse({ status: 201, type: ItemEntity })
  create(
    @Request() req: { user: { userId: string } },
    @Body() dto: CreateItemDto,
  ): Promise<ItemEntity> {
    return this.itemsService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List items owned by the authenticated user' })
  @ApiResponse({ status: 200, type: [ItemEntity] })
  findAll(
    @Request() req: { user: { userId: string } },
  ): Promise<ItemEntity[]> {
    return this.itemsService.findAllByUser(req.user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an item' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 204, description: 'Item deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  remove(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
  ): Promise<ItemEntity> {
    return this.itemsService.remove(id, req.user.userId);
  }
}
