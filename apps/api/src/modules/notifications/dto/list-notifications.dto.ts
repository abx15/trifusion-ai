import { IsOptional, IsString } from 'class-validator';

export class ListNotificationsDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsString()
  workspaceId?: string;
}
