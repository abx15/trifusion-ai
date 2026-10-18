import { ApiProperty } from '@nestjs/swagger';

export class WorkspaceSettingsEntity {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  workspaceId!: string;

  @ApiProperty({ nullable: true, maxLength: 255 })
  companyName!: string | null;

  @ApiProperty({ nullable: true, format: 'email' })
  companyEmail!: string | null;

  @ApiProperty({
    nullable: true,
    type: 'object',
    additionalProperties: true,
  })
  settings!: Record<string, unknown> | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}
