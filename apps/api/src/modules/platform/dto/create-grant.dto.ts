import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class CreateGrantDto {
  @ApiProperty({ description: 'Target workspace ID to access' })
  @IsString()
  @IsNotEmpty()
  targetWorkspaceId!: string;

  @ApiProperty({ description: 'Reason for access request' })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiProperty({ description: 'Access scope (e.g., "read:aggregate", "full")' })
  @IsString()
  @IsNotEmpty()
  scope!: string;

  @ApiProperty({ description: 'Grant expiry time', required: false })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
