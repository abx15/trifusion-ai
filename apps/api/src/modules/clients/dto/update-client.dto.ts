import { ApiPropertyOptional, OmitType, PartialType } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MaxLength } from "class-validator";
import { CreateClientDto } from "./create-client.dto";

export class UpdateClientDto extends OmitType(PartialType(CreateClientDto, {
  skipNullProperties: false,
}), [
  "email",
  "phone",
  "website",
  "address",
  "notes",
] as const) {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 40 })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 5000 })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string | null;
}
