import { IsUUID, IsString, IsOptional, IsArray, IsObject } from 'class-validator';

export class AssistantContextDto {
  @IsUUID()
  id!: string;

  @IsString()
  type!: string;

  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  dueDate?: string;
}

export class AssistantDto {
  @IsUUID()
  workspace_id!: string;

  @IsUUID()
  user_id!: string;

  @IsString()
  role!: string;

  @IsString()
  question!: string;

  @IsArray()
  @IsObject({ each: true })
  @IsOptional()
  retrieved_context?: AssistantContextDto[];

  @IsString()
  @IsOptional()
  request_id?: string;
}
