import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AcceptInvitationDto {
  @ApiProperty({ description: 'Invitation secret token received via link or email' })
  @IsString()
  @IsNotEmpty()
  token!: string;
}
