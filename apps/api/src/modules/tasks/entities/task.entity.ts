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
  @Field(() => String)
  workspaceId!: string;

  @ApiProperty({ format: "uuid" })
  @Field(() => String)
  projectId!: string;

  @ApiProperty({ nullable: true, format: "uuid" })
  @Field(() => String, { nullable: true })
  assigneeId?: string | null;

  @ApiProperty({ example: "Prepare kickoff plan" })
  @Field(() => String)
  title!: string;

  @ApiProperty({ nullable: true })
  @Field(() => String, { nullable: true })
  description?: string | null;

  @ApiProperty({ enum: TaskStatus })
  @Field(() => TaskStatus)
  status!: TaskStatus;

  @ApiProperty({ enum: TaskPriority })
  @Field(() => TaskPriority)
  priority!: TaskPriority;

  @ApiProperty({ nullable: true, format: "date-time" })
  @Field(() => Date, { nullable: true })
  dueDate?: Date | null;

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
  @Field(() => String)
  email!: string;

  @ApiProperty({ nullable: true })
  @Field(() => String, { nullable: true })
  firstName?: string | null;

  @ApiProperty({ nullable: true })
  @Field(() => String, { nullable: true })
  lastName?: string | null;
}

@ObjectType()
export class TaskConnection {
  @ApiProperty({ type: () => [Task] })
  @Field(() => [Task])
  data!: Task[];

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