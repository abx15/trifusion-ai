import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateClientDto } from './clients/dto/update-client.dto';
import { UpdateProjectDto } from './projects/dto/update-project.dto';
import { UpdateTaskDto } from './tasks/dto/update-task.dto';
import { ListTasksQueryDto } from './tasks/dto/list-tasks.dto';

describe('domain update DTOs', () => {
  it('allows clearing nullable client fields but rejects null names', async () => {
    const dto = plainToInstance(UpdateClientDto, {
      name: null,
      email: null,
      phone: null,
    });
    const errors = await validate(dto);

    expect(errors.map(({ property }) => property)).toEqual(['name']);
  });

  it('allows clearing nullable project fields but rejects null names', async () => {
    const dto = plainToInstance(UpdateProjectDto, {
      name: null,
      clientId: null,
      description: null,
    });
    const errors = await validate(dto);

    expect(errors.map(({ property }) => property)).toEqual(['name']);
  });

  it('allows clearing nullable task fields but rejects null project IDs', async () => {
    const dto = plainToInstance(UpdateTaskDto, {
      projectId: null,
      assigneeId: null,
      dueDate: null,
    });
    const errors = await validate(dto);

    expect(errors.map(({ property }) => property)).toEqual(['projectId']);
  });

  it('accepts explicit boolean filter values and rejects malformed ones', async () => {
    const valid = plainToInstance(ListTasksQueryDto, { overdue: 'false' });
    const invalid = plainToInstance(ListTasksQueryDto, { overdue: 'sometimes' });

    expect(valid.overdue).toBe(false);
    expect(await validate(valid)).toHaveLength(0);
    expect((await validate(invalid)).map(({ property }) => property)).toEqual(['overdue']);
  });
});
