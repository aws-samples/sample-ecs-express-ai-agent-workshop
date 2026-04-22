import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class TotpCodeDto {
  @ApiProperty({ example: '123456', description: '6-digit TOTP code from authenticator app' })
  @IsString()
  @Length(6, 6)
  code: string;
}
