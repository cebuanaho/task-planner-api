import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsMongoId, IsOptional, IsString } from 'class-validator';
import { TaskStatus } from '../tasks.schema';

export class UpdateTaskDto {
  @ApiPropertyOptional({ example: 'Prepare API' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Finish task planner API' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiPropertyOptional({ example: '665f1e6b8d3b2a0012345678' })
  @IsOptional()
  @IsMongoId()
  project?: string;

  @ApiPropertyOptional({ example: '665f1e6b8d3b2a0012345679' })
  @IsOptional()
  @IsMongoId()
  assignedTo?: string;

  @ApiPropertyOptional({ enum: TaskStatus, example: TaskStatus.InProgress })
  @IsOptional()
  status?: TaskStatus;
}
