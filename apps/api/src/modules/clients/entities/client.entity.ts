import { ObjectType, Field, ID, Int } from "@nestjs/graphql";
import { ClientStatus } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType()
export class Client {
 @ApiProperty({ format: "uuid" })
 @Field(() => ID)
 id!: string;

 @ApiProperty({ format: "uuid" })
 @Field()
 workspaceId!: string;

 @ApiProperty({ example: "Northwind Wellness Group" })
 @Field()
 name!: string;

 @ApiProperty({ nullable: true, example: "contact@example.com" })
 @Field({ nullable: true })
 email?: string | null;

 @ApiProperty({ nullable: true })
 @Field({ nullable: true })
 phone?: string | null;

 @ApiProperty({ nullable: true })
 @Field({ nullable: true })
 website?: string | null;

 @ApiProperty({ nullable: true })
 @Field({ nullable: true })
 address?: string | null;

 @ApiProperty({ nullable: true })
 @Field({ nullable: true })
 notes?: string | null;

 @ApiProperty({ enum: ClientStatus })
 @Field(() => ClientStatus)
 status!: ClientStatus;

 @ApiProperty({ format: "uuid" })
 @Field()
 createdBy!: string;

 @ApiProperty({ format: "date-time" })
 @Field()
 createdAt!: Date;

 @ApiProperty({ format: "date-time" })
 @Field()
 updatedAt!: Date;

 @ApiProperty({ nullable: true, format: "date-time" })
 @Field({ nullable: true })
 deletedAt?: Date | null;
}

@ObjectType()
export class ClientConnection {
 @ApiProperty({ type: () => [Client] })
 @Field(() => [Client])
 data!: Client[];

 @ApiProperty({ nullable: true })
 @Field({ nullable: true })
 nextCursor!: string | null;

 @ApiProperty()
 @Field()
 hasMore!: boolean;

 @ApiProperty()
 @Field(() => Int)
 total!: number;

 @ApiProperty()
 @Field(() => Int)
 limit!: number;
}
