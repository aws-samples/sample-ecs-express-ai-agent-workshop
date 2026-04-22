import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateItemDto {
  @ApiProperty({ example: 'My Item' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
