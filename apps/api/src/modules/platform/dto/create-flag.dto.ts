import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsObject } from 'class-validator';

export class CreateFlagDto {
  @ApiProperty({ description: 'Flag key (unique)' })
  @IsString()
  @IsNotEmpty()
  key!: string;

  @ApiProperty({ description: 'Flag description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Flag type (boolean, string, number, json)', required: false })
  @IsString()
  @IsEnum(['boolean', 'string', 'number', 'json'])
  @IsOptional()
  type?: string;

  @ApiProperty({ description: 'Default value', required: false })
  @IsString()
  @IsOptional()
  defaultValue?: string;

  @ApiProperty({ description: 'Targeting rules (JSON)', required: false })
  @IsObject()
  @IsOptional()
  rules?: Record<string, unknown>;

  @ApiProperty({ description: 'Flag status (ACTIVE, DISABLED, KILLED)', required: false })
  @IsString()
  @IsEnum(['ACTIVE', 'DISABLED', 'KILLED'])
  @IsOptional()
  status?: string;

  @ApiProperty({ description: 'Reason for change' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
