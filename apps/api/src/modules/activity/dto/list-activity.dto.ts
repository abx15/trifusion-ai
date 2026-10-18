import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { CursorPaginationQueryDto } from "../../../common/dto/pagination.dto";
import { EntityType } from "@prisma/client";

export class ListActivityQueryDto extends CursorPaginationQueryDto {
 @ApiPropertyOptional({ enum: EntityType })
 @IsOptional()
 @IsEnum(EntityType)
 entityType?: EntityType;

 @ApiPropertyOptional()
 @IsOptional()
 @IsString()
 entityId?: string;

 @ApiPropertyOptional()
 @IsOptional()
 @IsUUID()
 actorId?: string;
}
