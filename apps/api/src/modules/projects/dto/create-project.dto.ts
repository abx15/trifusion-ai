import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength, IsDateString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ProjectStatus } from "@prisma/client";

export class CreateProjectDto {
 @ApiProperty({ minLength: 2, maxLength: 100 })
 @IsString()
 @MinLength(2)
 @MaxLength(100)
 name!: string;

 @ApiPropertyOptional()
 @IsOptional()
 @IsString()
 description?: string;

 @ApiPropertyOptional({ enum: ProjectStatus, default: ProjectStatus.PLANNING })
 @IsOptional()
 @IsEnum(ProjectStatus)
 status?: ProjectStatus;

 @ApiPropertyOptional()
 @IsOptional()
 @IsUUID()
 clientId?: string;

 @ApiPropertyOptional()
 @IsOptional()
 @IsDateString()
 startDate?: string;

 @ApiPropertyOptional()
 @IsOptional()
 @IsDateString()
 endDate?: string;
}
