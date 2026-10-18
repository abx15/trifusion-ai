import { IsEmail, IsOptional, IsString, MaxLength } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateWorkspaceSettingsDto {
 @ApiPropertyOptional()
 @IsOptional()
 @IsString()
 @MaxLength(255)
 companyName?: string | null;

 @ApiPropertyOptional()
 @IsOptional()
 @IsEmail()
 @IsString()
 companyEmail?: string | null;
}
