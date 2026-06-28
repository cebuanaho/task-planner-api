import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { BootstrapAdminDto } from './dto/bootstrap-admin.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const user = await this.usersService.create(
      registerDto.email,
      registerDto.password,
    );

    this.logger.log(`User registered: ${user.email}`);

    return {
      id: user._id,
      email: user.email,
      role: user.role,
    };
  }

  async bootstrapAdmin(bootstrapAdminDto: BootstrapAdminDto) {
    const bootstrapKey = process.env.ADMIN_BOOTSTRAP_KEY;

    if (!bootstrapKey || bootstrapAdminDto.bootstrapKey !== bootstrapKey) {
      throw new ForbiddenException('Invalid bootstrap key');
    }

    const adminExists = await this.usersService.hasAdmin();

    if (adminExists) {
      throw new BadRequestException('Admin already exists');
    }

    const user = await this.usersService.createAdmin(
      bootstrapAdminDto.email,
      bootstrapAdminDto.password,
    );

    this.logger.log(`Admin bootstrap created: ${user.email}`);

    return {
      id: user._id,
      email: user.email,
      role: user.role,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    this.logger.log(`User logged in: ${user.email}`);

    return {
      accessToken: token,
    };
  }
}
