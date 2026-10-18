import { IsEnum, IsOptional, IsString, IsIn, IsDateString, MaxLength } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { CursorPaginationQueryDto } from "../../../common/dto/pagination.dto";
import { ClientStatus } from "@prisma/client";

export class ListClientsQueryDto extends CursorPaginationQueryDto {
 @ApiPropertyOptional({ enum: ClientStatus })
 @IsOptional()
 @IsEnum(ClientStatus)
 status?: ClientStatus;

 @ApiPropertyOptional({ description: "Search query" })
 @IsOptional()
 @IsString()
 @MaxLength(100)
 q?: string;

 @ApiPropertyOptional({ enum: ["createdAt", "name", "status"], default: "createdAt" })
 @IsOptional()
 @IsIn(["createdAt", "name", "status"])
 sortBy?: "createdAt" | "name" | "status";

 @ApiPropertyOptional({ description: "Include clients created on or after this date" })
 @IsOptional()
 @IsDateString()
 createdAfter?: string;

 @ApiPropertyOptional({ description: "Include clients created on or before this date" })
 @IsOptional()
 @IsDateString()
 createdBefore?: string;
}
