import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateClientDto {
 @ApiProperty({ minLength: 2, maxLength: 100 })
 @Transform(({ value }) => typeof value === "string" ? value.trim() : value)
 @IsString()
 @MinLength(2)
 @MaxLength(100)
 name!: string;

 @ApiPropertyOptional()
 @IsOptional()
 @IsEmail()
 email?: string;

 @ApiPropertyOptional()
 @IsOptional()
 @IsString()
 @MaxLength(40)
 phone?: string;

 @ApiPropertyOptional()
 @IsOptional()
 @IsString()
 @MaxLength(255)
 website?: string;

 @ApiPropertyOptional()
 @IsOptional()
 @IsString()
 @MaxLength(500)
 address?: string;

 @ApiPropertyOptional()
 @IsOptional()
 @IsString()
 @MaxLength(5000)
 notes?: string;
}
