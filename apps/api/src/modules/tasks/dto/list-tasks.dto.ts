import { IsEnum, IsOptional, IsString, IsUUID, IsBoolean, IsIn, IsDateString, MaxLength } from "class-validator";
import { Transform } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { CursorPaginationQueryDto } from "../../../common/dto/pagination.dto";
import { ProjectStatus, TaskStatus, TaskPriority } from "@prisma/client";

export class ListTasksQueryDto extends CursorPaginationQueryDto {
 @ApiPropertyOptional({ enum: TaskStatus })
 @IsOptional()
 @IsEnum(TaskStatus)
 status?: TaskStatus;

 @ApiPropertyOptional({ enum: TaskPriority })
 @IsOptional()
 @IsEnum(TaskPriority)
 priority?: TaskPriority;

 @ApiPropertyOptional()
 @IsOptional()
 @IsUUID()
 projectId?: string;

 @ApiPropertyOptional()
 @IsOptional()
 @IsUUID()
 assigneeId?: string;

 @ApiPropertyOptional({ enum: ProjectStatus })
 @IsOptional()
 @IsEnum(ProjectStatus)
 projectStatus?: ProjectStatus;

 @ApiPropertyOptional()
 @IsOptional()
 @IsUUID()
 clientId?: string;

 @ApiPropertyOptional()
 @IsOptional()
 @IsBoolean()
 @Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : value)
 overdue?: boolean;

 @ApiPropertyOptional({ description: "Include soft-archived tasks" })
 @IsOptional()
 @IsBoolean()
 @Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : value)
 includeArchived?: boolean;

 @ApiPropertyOptional({ description: "Search query" })
 @IsOptional()
 @IsString()
 @MaxLength(100)
 q?: string;

 @ApiPropertyOptional({ enum: ["createdAt", "dueDate", "priority", "status"], default: "createdAt" })
 @IsOptional()
 @IsIn(["createdAt", "dueDate", "priority", "status"])
 sortBy?: "createdAt" | "dueDate" | "priority" | "status";

 @ApiPropertyOptional()
 @IsOptional()
 @IsDateString()
 dueDateFrom?: string;

 @ApiPropertyOptional()
 @IsOptional()
 @IsDateString()
 dueDateTo?: string;
}
