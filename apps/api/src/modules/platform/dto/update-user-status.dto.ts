import { IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';

export class UpdateUserStatusDto {
  @ApiProperty({ enum: UserStatus, example: UserStatus.SUSPENDED })
  @IsEnum(UserStatus)
  @IsNotEmpty()
  status!: UserStatus;

  @ApiProperty({ description: 'Mandatory justification for sensitive administrative action' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  reason!: string;
}
