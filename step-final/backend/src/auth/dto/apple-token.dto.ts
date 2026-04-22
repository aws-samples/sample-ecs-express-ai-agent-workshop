import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AppleFullName {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  givenName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  familyName?: string;
}

export class AppleTokenDto {
  @ApiProperty({ description: 'The identity token JWT from Sign in with Apple' })
  @IsNotEmpty()
  @IsString()
  identityToken!: string;

  @ApiPropertyOptional({ description: 'Full name (only provided on first authorization)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => AppleFullName)
  fullName?: AppleFullName;
}
