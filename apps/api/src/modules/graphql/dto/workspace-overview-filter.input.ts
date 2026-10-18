import { Field, InputType } from '@nestjs/graphql';
import { ProjectStatus, TaskStatus } from '@prisma/client';

@InputType()
export class WorkspaceOverviewFilterInput {
  @Field({ nullable: true })
  projectId?: string;

  @Field(() => ProjectStatus, { nullable: true })
  projectStatus?: ProjectStatus;

  @Field(() => TaskStatus, { nullable: true })
  taskStatus?: TaskStatus;

  @Field({ nullable: true })
  assigneeId?: string;

  @Field({ nullable: true })
  createdAfter?: string;

  @Field({ nullable: true })
  createdBefore?: string;
}
