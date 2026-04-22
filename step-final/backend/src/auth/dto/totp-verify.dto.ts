import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class TotpVerifyDto {
  @ApiProperty({ example: 'eyJhbGciOiJ...', description: 'Temporary MFA token from sign-in' })
  @IsString()
  mfaToken: string;

  @ApiProperty({ example: '123456', description: '6-digit TOTP code or recovery code' })
  @IsString()
  @Length(6, 10)
  code: string;
}
