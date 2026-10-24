import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { PlatformStaffRoleType } from '@prisma/client';

export class AssignStaffRoleDto {
  @ApiProperty({ description: 'Target user ID' })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ description: 'Platform staff role', enum: PlatformStaffRoleType })
  @IsEnum(PlatformStaffRoleType)
  @IsNotEmpty()
  role!: PlatformStaffRoleType;

  @ApiProperty({ description: 'Reason for role assignment' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
