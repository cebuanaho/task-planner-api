import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ example: 'Prepare API' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Finish task planner API' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '665f1e6b8d3b2a0012345678' })
  @IsMongoId()
  project: string;

  @ApiProperty({ example: '665f1e6b8d3b2a0012345679' })
  @IsMongoId()
  assignedTo: string;
}
