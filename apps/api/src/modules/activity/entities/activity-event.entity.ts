import { ObjectType, Field, ID, Int } from "@nestjs/graphql";
import { EntityType, ActivityAction } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType()
export class ActivityActor {
 @ApiProperty({ format: "uuid" })
 @Field(() => ID)
 id!: string;

 @ApiProperty({ example: "person@example.com" })
 @Field()
 email!: string;
}

@ObjectType()
export class ActivityEvent {
 @ApiProperty({ format: "uuid" })
 @Field(() => ID)
 id!: string;
 @ApiProperty({ format: "uuid" })
 @Field()
 workspaceId!: string;
 @ApiProperty({ nullable: true, format: "uuid" })
 @Field({ nullable: true })
 actorId?: string | null;
 @ApiProperty({ enum: EntityType })
 @Field(() => EntityType)
 entityType!: EntityType;
 @ApiProperty()
 @Field()
 entityId!: string;
 @ApiProperty({ enum: ActivityAction })
 @Field(() => ActivityAction)
 action!: ActivityAction;
 @ApiProperty({ format: "date-time" })
 @Field()
 createdAt!: Date;

 @ApiProperty({ nullable: true, type: () => ActivityActor })
 @Field(() => ActivityActor, { nullable: true })
 actor?: ActivityActor | null;
}

@ObjectType()
export class ActivityEventConnection {
 @ApiProperty({ type: () => [ActivityEvent] })
 @Field(() => [ActivityEvent])
 data!: ActivityEvent[];
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
