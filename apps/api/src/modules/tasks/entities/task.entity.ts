import { ObjectType, Field, ID, Int } from "@nestjs/graphql";
import { TaskStatus, TaskPriority } from "@prisma/client";
import { Project } from "../../projects/entities/project.entity";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType()
export class Task {
 @ApiProperty({ format: "uuid" })
 @Field(() => ID)
 id!: string;

 @ApiProperty({ format: "uuid" })
 @Field()
 workspaceId!: string;

 @ApiProperty({ format: "uuid" })
 @Field()
 projectId!: string;

 @ApiProperty({ nullable: true, format: "uuid" })
 @Field({ nullable: true })
 assigneeId?: string | null;

 @ApiProperty({ example: "Prepare kickoff plan" })
 @Field()
 title!: string;

 @ApiProperty({ nullable: true })
 @Field({ nullable: true })
 description?: string | null;

 @ApiProperty({ enum: TaskStatus })
 @Field(() => TaskStatus)
 status!: TaskStatus;

 @ApiProperty({ enum: TaskPriority })
 @Field(() => TaskPriority)
 priority!: TaskPriority;

 @ApiProperty({ nullable: true, format: "date-time" })
 @Field({ nullable: true })
 dueDate?: Date | null;

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

 @ApiProperty({ nullable: true, type: () => Project })
 @Field(() => Project, { nullable: true })
 project?: Project | null;

 @ApiProperty({ nullable: true, type: () => TaskAssignee })
 @Field(() => TaskAssignee, { nullable: true })
 assignee?: TaskAssignee | null;
}

@ObjectType()
export class TaskAssignee {
 @ApiProperty({ format: "uuid" })
 @Field(() => ID)
 id!: string;

 @ApiProperty({ example: "person@example.com" })
 @Field()
 email!: string;

 @ApiProperty({ nullable: true })
 @Field({ nullable: true })
 firstName?: string | null;

 @ApiProperty({ nullable: true })
 @Field({ nullable: true })
 lastName?: string | null;
}

@ObjectType()
export class TaskConnection {
 @ApiProperty({ type: () => [Task] })
 @Field(() => [Task])
 data!: Task[];

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
