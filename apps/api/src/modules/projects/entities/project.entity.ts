import { ObjectType, Field, ID, Int } from "@nestjs/graphql";
import { ProjectStatus } from "@prisma/client";
import { Client } from "../../clients/entities/client.entity";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType()
export class Project {
 @ApiProperty({ format: "uuid" })
 @Field(() => ID)
 id!: string;

 @ApiProperty({ format: "uuid" })
 @Field()
 workspaceId!: string;

 @ApiProperty({ nullable: true, format: "uuid" })
 @Field({ nullable: true })
 clientId?: string | null;

 @ApiProperty({ example: "Customer Portal Refresh" })
 @Field()
 name!: string;

 @ApiProperty({ nullable: true })
 @Field({ nullable: true })
 description?: string | null;

 @ApiProperty({ enum: ProjectStatus })
 @Field(() => ProjectStatus)
 status!: ProjectStatus;

 @ApiProperty({ nullable: true, format: "date-time" })
 @Field({ nullable: true })
 startDate?: Date | null;

 @ApiProperty({ nullable: true, format: "date-time" })
 @Field({ nullable: true })
 endDate?: Date | null;

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

 @ApiProperty({ nullable: true, type: () => Client })
 @Field(() => Client, { nullable: true })
 client?: Client | null;

 @ApiProperty()
 @Field(() => Int)
 taskCount!: number;
}

@ObjectType()
export class ProjectConnection {
 @ApiProperty({ type: () => [Project] })
 @Field(() => [Project])
 data!: Project[];

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
