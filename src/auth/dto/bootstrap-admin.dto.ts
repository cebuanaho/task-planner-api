import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class BootstrapAdminDto {
  @ApiProperty({ example: 'admin@mail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'bootstrap-secret-123' })
  @IsString()
  bootstrapKey: string;
}
