import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsMongoId()
  project: string;

  @IsMongoId()
  assignedTo: string;
}
