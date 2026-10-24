import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ApproveGrantDto {
  @ApiProperty({ description: 'Reason for approval' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
