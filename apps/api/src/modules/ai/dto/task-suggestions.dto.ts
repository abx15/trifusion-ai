import { IsUUID, IsString, IsOptional, IsObject } from 'class-validator';

export class TaskSuggestionTaskDto {
  @IsUUID()
  id!: string;

  @IsString()
  title!: string;

  @IsString()
  status!: string;

  @IsString()
  @IsOptional()
  priority?: string;
}

export class TaskSuggestionProjectDto {
  @IsUUID()
  id!: string;

  @IsString()
  name!: string;

  @IsString()
  status!: string;
}

export class TaskSuggestionsDto {
  @IsUUID()
  workspace_id!: string;

  @IsUUID()
  user_id!: string;

  @IsString()
  role!: string;

  @IsUUID()
  task_id!: string;

  @IsObject()
  task!: TaskSuggestionTaskDto;

  @IsObject()
  project!: TaskSuggestionProjectDto;

  @IsString()
  @IsOptional()
  request_id?: string;
}
