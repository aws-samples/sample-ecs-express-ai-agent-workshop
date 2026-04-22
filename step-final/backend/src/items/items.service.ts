import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto } from './dto/create-item.dto';

@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  private t(key: string, args?: Record<string, unknown>): string {
    const i18n = I18nContext.current();
    return i18n ? i18n.t(key, { args }) : key;
  }

  async create(userId: string, dto: CreateItemDto) {
    return this.prisma.item.create({ data: { ...dto, userId } });
  }

  async findAllByUser(userId: string) {
    return this.prisma.item.findMany({ where: { userId } });
  }

  async remove(id: string, userId: string) {
    const item = await this.prisma.item.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(this.t('items.ITEM_NOT_FOUND', { id }));
    }
    if (item.userId !== userId) {
      throw new ForbiddenException(this.t('items.NOT_ITEM_OWNER'));
    }
    return this.prisma.item.delete({ where: { id } });
  }
}
