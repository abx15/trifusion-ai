import { IsEnum, IsOptional, IsString, IsUUID, IsIn, IsDateString, MaxLength } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { CursorPaginationQueryDto } from "../../../common/dto/pagination.dto";
import { ProjectStatus } from "@prisma/client";

export class ListProjectsQueryDto extends CursorPaginationQueryDto {
 @ApiPropertyOptional({ enum: ProjectStatus })
 @IsOptional()
 @IsEnum(ProjectStatus)
 status?: ProjectStatus;

 @ApiPropertyOptional()
 @IsOptional()
 @IsUUID()
 clientId?: string;

 @ApiPropertyOptional({ description: "Search query" })
 @IsOptional()
 @IsString()
 @MaxLength(100)
 q?: string;

 @ApiPropertyOptional({ enum: ["createdAt", "name", "status", "startDate"], default: "createdAt" })
 @IsOptional()
 @IsIn(["createdAt", "name", "status", "startDate"])
 sortBy?: "createdAt" | "name" | "status" | "startDate";

 @ApiPropertyOptional()
 @IsOptional()
 @IsDateString()
 startDateFrom?: string;

 @ApiPropertyOptional()
 @IsOptional()
 @IsDateString()
 startDateTo?: string;
}