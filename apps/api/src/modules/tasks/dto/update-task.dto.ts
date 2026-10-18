import { ApiPropertyOptional, OmitType, PartialType } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { CreateTaskDto } from "./create-task.dto";

export class UpdateTaskDto extends OmitType(PartialType(CreateTaskDto, {
  skipNullProperties: false,
}), [
  "assigneeId",
  "description",
  "dueDate",
] as const) {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  assigneeId?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 5000 })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  dueDate?: string | null;
}
