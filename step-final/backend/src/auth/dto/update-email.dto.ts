import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class UpdateEmailDto {
  @ApiProperty({ example: 'newemail@example.com' })
  @IsEmail()
  email: string;
}
