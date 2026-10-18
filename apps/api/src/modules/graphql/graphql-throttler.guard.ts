import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class GraphQLThrottlerGuard extends ThrottlerGuard {
  protected getRequestResponse(context: ExecutionContext) {
    if (context.getType<string>() === 'graphql') {
      return GqlExecutionContext.create(context).getContext();
    }
    return super.getRequestResponse(context);
  }
}
