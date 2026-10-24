import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { WorkspaceStatus } from '@prisma/client';

export class UpdateWorkspaceStatusDto {
  @ApiProperty({ description: 'New workspace status', enum: WorkspaceStatus })
  @IsEnum(WorkspaceStatus)
  @IsNotEmpty()
  status!: WorkspaceStatus;

  @ApiProperty({ description: 'Reason for status change' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
