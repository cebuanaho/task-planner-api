import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { Roles } from '../auth/roles/roles/roles.decorator';
import { RolesGuard } from '../auth/roles/roles.guard';
import type { RequestWithUser } from '../auth/types/request-with-user.type';
import { UserRole } from '../users/users.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { TasksService } from './tasks.service';

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
  findMyTasks(@Req() req: RequestWithUser) {
    return this.tasksService.findMyTasks(req.user.sub);
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
}
