import { IsOptional, IsString, IsInt, Min, Max, IsIn } from "class-validator";
import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class CursorPaginationQueryDto {
 @ApiPropertyOptional({ description: "Cursor for pagination" })
 @IsOptional()
 @IsString()
 cursor?: string;

 @ApiPropertyOptional({ description: "Number of items to return", default: 20, minimum: 1, maximum: 50 })
 @IsOptional()
 @Type(() => Number)
 @IsInt()
 @Min(1)
 @Max(50)
 limit?: number;

 @ApiPropertyOptional({ enum: ["asc", "desc"], default: "desc" })
 @IsOptional()
 @IsIn(["asc", "desc"])
 sortOrder?: "asc" | "desc";
}

export class CursorPaginationResponseDto<T> {
 data!: T[];
 nextCursor!: string | null;
 hasMore!: boolean;
}
