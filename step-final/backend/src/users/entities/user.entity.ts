import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserEntity {
  @ApiProperty({ example: 'clxxxxxxxxxxxxxxxxxxxxxxxx' })
  id: string;

  @ApiProperty({ example: 'alice@example.com' })
  email: string;

  @ApiPropertyOptional({ example: 'Alice' })
  name: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
