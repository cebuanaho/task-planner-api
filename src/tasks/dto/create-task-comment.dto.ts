import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateTaskCommentDto {
  @ApiProperty({ example: 'I started working on this task.' })
  @IsString()
  @MinLength(1)
  text: string;
}
