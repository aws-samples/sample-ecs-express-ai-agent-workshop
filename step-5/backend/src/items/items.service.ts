import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto } from './dto/create-item.dto';

@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateItemDto) {
    return this.prisma.item.create({ data: { ...dto, userId } });
  }

  async findAllByUser(userId: string) {
    return this.prisma.item.findMany({ where: { userId } });
  }

  async remove(id: string, userId: string) {
    const item = await this.prisma.item.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Item ${id} not found`);
    }
    if (item.userId !== userId) {
      throw new ForbiddenException('Not the item owner');
    }
    return this.prisma.item.delete({ where: { id } });
  }
}
