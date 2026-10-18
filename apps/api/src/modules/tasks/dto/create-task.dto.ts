import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength, IsDateString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TaskStatus, TaskPriority } from "@prisma/client";

export class CreateTaskDto {
 @ApiProperty({ minLength: 2, maxLength: 200 })
 @IsString()
 @MinLength(2)
 @MaxLength(200)
 title!: string;

 @ApiPropertyOptional()
 @IsOptional()
 @IsString()
 description?: string;

 @ApiProperty()
 @IsUUID()
 projectId!: string;

 @ApiPropertyOptional()
 @IsOptional()
 @IsUUID()
 assigneeId?: string;

 @ApiPropertyOptional({ enum: TaskStatus, default: TaskStatus.TODO })
 @IsOptional()
 @IsEnum(TaskStatus)
 status?: TaskStatus;

 @ApiPropertyOptional({ enum: TaskPriority, default: TaskPriority.MEDIUM })
 @IsOptional()
 @IsEnum(TaskPriority)
 priority?: TaskPriority;

 @ApiPropertyOptional()
 @IsOptional()
 @IsDateString()
 dueDate?: string;
}
