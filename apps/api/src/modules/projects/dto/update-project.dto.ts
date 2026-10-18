import { ApiPropertyOptional, OmitType, PartialType } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { CreateProjectDto } from "./create-project.dto";

export class UpdateProjectDto extends OmitType(PartialType(CreateProjectDto, {
  skipNullProperties: false,
}), [
  "clientId",
  "description",
  "startDate",
  "endDate",
] as const) {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  clientId?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 5000 })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  endDate?: string | null;
}
