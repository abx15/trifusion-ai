import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ProjectStatus, TaskStatus } from '@prisma/client';

@ObjectType()
export class StatusCount {
  @Field(() => String)
  status!: ProjectStatus | TaskStatus;

  @Field(() => Int)
  count!: number;
}

@ObjectType()
export class WorkspaceOverview {
  @Field()
  workspaceId!: string;

  @Field()
  workspaceName!: string;

  @Field()
  role!: string;

  @Field(() => Int)
  projectCount!: number;

  @Field(() => Int)
  taskCount!: number;

  @Field(() => [StatusCount])
  projectStatusCounts!: StatusCount[];

  @Field(() => [StatusCount])
  taskStatusCounts!: StatusCount[];

  @Field(() => Int)
  overdueTasks!: number;

  @Field(() => Int)
  upcomingDeadlines!: number;
}
