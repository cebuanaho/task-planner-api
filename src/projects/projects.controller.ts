import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotFoundException } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { Roles } from '../auth/roles/roles/roles.decorator';
import { RolesGuard } from '../auth/roles/roles.guard';
import type { RequestWithUser } from '../auth/types/request-with-user.type';
import { UserRole } from '../users/users.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.Admin)
  create(
    @Body() createProjectDto: CreateProjectDto,
    @Req() req: RequestWithUser,
  ) {
    return this.projectsService.create(createProjectDto, req.user.sub);
  }

  @Get()
  @UseGuards(JwtGuard)
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  async findById(@Param('id') id: string) {
    const project = await this.projectsService.findById(id);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }
}
