import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class TeamWorkloadEntry {
  @Field(() => String)
  assigneeId!: string;

  @Field(() => Int)
  openTasks!: number;

  @Field(() => Int)
  weightedLoad!: number;
}

@ObjectType()
export class StatusMetric {
  @Field(() => String)
  status!: string;

  @Field(() => Int)
  count!: number;
}

@ObjectType()
export class DateRange {
  @Field(() => String)
  start!: string;

  @Field(() => String)
  end!: string;
}

@ObjectType()
export class AnalyticsFilters {
  @Field(() => String, { nullable: true })
  projectId?: string | null;

  @Field(() => String, { nullable: true })
  projectStatus?: string | null;

  @Field(() => String, { nullable: true })
  assigneeId?: string | null;

  @Field(() => String, { nullable: true })
  taskStatus?: string | null;

  @Field(() => String, { nullable: true })
  startDate?: string | null;

  @Field(() => String, { nullable: true })
  endDate?: string | null;
}

@ObjectType()
export class WorkspaceAnalytics {
  @Field(() => String)
  workspaceId!: string;

  @Field(() => String)
  workspaceName!: string;

  @Field(() => String)
  role!: string;

  @Field(() => DateRange)
  reportingPeriod!: DateRange;

  @Field(() => AnalyticsFilters)
  filters!: AnalyticsFilters;

  @Field(() => String)
  generatedAt!: string;

  @Field(() => String)
  dataFreshness!: string;

  @Field(() => String)
  metricVersion!: string;

  @Field(() => Int)
  activeProjects!: number;

  @Field(() => [StatusMetric])
  projectStatusCounts!: StatusMetric[];

  @Field(() => [StatusMetric])
  taskStatusCounts!: StatusMetric[];

  @Field(() => Int)
  overdueTasks!: number;

  @Field(() => Int)
  upcomingDeadlines!: number;

  @Field(() => Number)
  completionRate!: number;

  @Field(() => Int)
  tasksCompletedThisWeek!: number;

  @Field(() => [TeamWorkloadEntry])
  teamWorkload!: TeamWorkloadEntry[];
}