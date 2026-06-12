import { IsEnum } from 'class-validator';
import { TaskStatus } from '../tasks.schema';

export class UpdateTaskStatusDto {
  @IsEnum(TaskStatus)
  status: TaskStatus;
}
