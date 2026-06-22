import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { Roles } from '../auth/roles/roles/roles.decorator';
import { RolesGuard } from '../auth/roles/roles.guard';
import type { RequestWithUser } from '../auth/types/request-with-user.type';
import { UserRole } from '../users/users.schema';
import { CreateTaskCommentDto } from './dto/create-task-comment.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { TasksService } from './tasks.service';
import { TaskStatus } from './tasks.schema';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.Admin)
  create(@Body() createTaskDto: CreateTaskDto, @Req() req: RequestWithUser) {
    return this.tasksService.create(createTaskDto, req.user.sub);
  }

  @Get('my-tasks')
  @UseGuards(JwtGuard)
  findMyTasks(
    @Req() req: RequestWithUser,
    @Query('limit') limit = '10',
    @Query('skip') skip = '0',
    @Query('status') status?: TaskStatus,
    @Query('search') search?: string,
    @Query('deadlineInDays') deadlineInDays?: string,
  ) {
    return this.tasksService.findMyTasks(
      req.user.sub,
      Number(limit),
      Number(skip),
      {
        status,
        search,
        deadlineInDays: deadlineInDays ? Number(deadlineInDays) : undefined,
      },
    );
  }

  @Patch(':id/status')
  @UseGuards(JwtGuard)
  updateStatus(
    @Param('id') id: string,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
    @Req() req: RequestWithUser,
  ) {
    return this.tasksService.updateMyTaskStatus(
      id,
      req.user.sub,
      updateTaskStatusDto,
    );
  }

  @Post(':id/comments')
  @UseGuards(JwtGuard)
  addComment(
    @Param('id') id: string,
    @Body() createTaskCommentDto: CreateTaskCommentDto,
    @Req() req: RequestWithUser,
  ) {
    return this.tasksService.addComment(
      id,
      req.user.sub,
      req.user.role,
      createTaskCommentDto,
    );
  }

  @Get(':id/comments')
  @UseGuards(JwtGuard)
  findComments(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.tasksService.findComments(id, req.user.sub, req.user.role);
  }
}
