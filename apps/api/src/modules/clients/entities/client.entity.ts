import { ObjectType, Field, ID, Int } from "@nestjs/graphql";
import { ClientStatus } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType()
export class Client {
  @ApiProperty({ format: "uuid" })
  @Field(() => ID)
  id!: string;

@ApiProperty({ format: "uuid" })
  @Field(() => String)
  workspaceId!: string;

  @ApiProperty({ example: "Northwind Wellness Group" })
  @Field(() => String)
  name!: string;

  @ApiProperty({ nullable: true, example: "contact@example.com" })
  @Field(() => String, { nullable: true })
  email?: string | null;

  @ApiProperty({ nullable: true })
  @Field(() => String, { nullable: true })
  phone?: string | null;

  @ApiProperty({ nullable: true })
  @Field(() => String, { nullable: true })
  website?: string | null;

  @ApiProperty({ nullable: true })
  @Field(() => String, { nullable: true })
  address?: string | null;

  @ApiProperty({ nullable: true })
  @Field(() => String, { nullable: true })
  notes?: string | null;

  @ApiProperty({ enum: ClientStatus })
  @Field(() => ClientStatus)
  status!: ClientStatus;

  @ApiProperty({ format: "uuid" })
  @Field(() => String)
  createdBy!: string;

  @ApiProperty({ format: "date-time" })
  @Field(() => Date)
  createdAt!: Date;

  @ApiProperty({ format: "date-time" })
  @Field(() => Date)
  updatedAt!: Date;

  @ApiProperty({ nullable: true, format: "date-time" })
  @Field(() => Date, { nullable: true })
  deletedAt?: Date | null;
}

@ObjectType()
export class ClientConnection {
  @ApiProperty({ type: () => [Client] })
  @Field(() => [Client])
  data!: Client[];

  @ApiProperty({ nullable: true })
  @Field(() => String, { nullable: true })
  nextCursor!: string | null;

  @ApiProperty()
  @Field(() => Boolean)
  hasMore!: boolean;

  @ApiProperty()
  @Field(() => Int)
  total!: number;

  @ApiProperty()
  @Field(() => Int)
  limit!: number;
}