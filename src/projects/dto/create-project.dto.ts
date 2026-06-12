import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'First Project' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Simple project' })
  @IsOptional()
  @IsString()
  description?: string;
}
