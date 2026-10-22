import { IsUUID, IsArray, IsOptional, IsString } from 'class-validator';

export class ProjectSummaryDto {
  @IsUUID()
  workspace_id!: string;

  @IsUUID()
  user_id!: string;

  @IsString()
  role!: string;

  @IsUUID()
  project_id!: string;

  @IsArray()
  @IsOptional()
  tasks?: any[];

  @IsArray()
  @IsOptional()
  activity?: any[];

  @IsString()
  @IsOptional()
  request_id?: string;
}
