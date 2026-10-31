import { IsUUID, IsArray, IsOptional, IsString } from 'class-validator';

export interface TaskInput {
  id: string;
  title: string;
  status: string;
  priority: string;
}

export interface ActivityInput {
  id: string;
  action: string;
  timestamp: string;
}

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
  tasks?: TaskInput[];

  @IsArray()
  @IsOptional()
  activity?: ActivityInput[];

  @IsString()
  @IsOptional()
  request_id?: string;
}
