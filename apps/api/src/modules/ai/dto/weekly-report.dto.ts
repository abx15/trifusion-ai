import { IsUUID, IsString, IsObject, IsOptional } from 'class-validator';

export class WeeklyReportTaskItem {
  @IsUUID()
  id!: string;

  @IsString()
  title!: string;

  @IsString()
  status!: string;

  @IsString()
  @IsOptional()
  priority?: string;

  @IsString()
  @IsOptional()
  dueDate?: string;
}

export class WeeklyReportAnalyticsDto {
  [key: string]: unknown;

  @IsObject()
  @IsOptional()
  activeProjects?: number;

  @IsObject()
  @IsOptional()
  overdueTasks?: number;

  @IsObject()
  @IsOptional()
  tasksCompleted?: number;
}

export class WeeklyReportDto {
  @IsUUID()
  workspace_id!: string;

  @IsUUID()
  user_id!: string;

  @IsString()
  role!: string;

  @IsObject()
  analytics!: WeeklyReportAnalyticsDto;

  @IsObject()
  reporting_period!: {
    start: string;
    end: string;
  };

  @IsString()
  @IsOptional()
  request_id?: string;
}
