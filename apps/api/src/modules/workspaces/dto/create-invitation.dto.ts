import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WorkspaceRole } from '@prisma/client';

export class CreateInvitationDto {
  @ApiProperty({ description: 'Invitee email address', example: 'colleague@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: 'Role to assign upon acceptance',
    enum: WorkspaceRole,
    default: WorkspaceRole.MEMBER,
  })
  @IsEnum(WorkspaceRole)
  role: WorkspaceRole = WorkspaceRole.MEMBER;
}
