import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JobsService } from './jobs.service';

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private readonly service: JobsService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post()
  create() {
    return this.service.create(null, 'manual', undefined);
  }
}
