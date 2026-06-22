import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from '../projects/projects.schema';
import { User, UserDocument } from '../users/users.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { Task, TaskDocument, TaskStatus } from './tasks.schema';

type TaskFilters = {
  status?: TaskStatus;
  search?: string;
  deadlineInDays?: number;
};

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectModel(Task.name)
    private taskModel: Model<TaskDocument>,
    @InjectModel(Project.name)
    private projectModel: Model<ProjectDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async create(createTaskDto: CreateTaskDto, adminId: string) {
    const [project, user] = await Promise.all([
      this.projectModel.findById(createTaskDto.project),
      this.userModel.findById(createTaskDto.assignedTo),
    ]);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const task = await this.taskModel.create({
      ...createTaskDto,
      createdBy: adminId,
    });

    this.logger.log(`Task created: ${task._id.toString()}`);

    return task;
  }

  findMyTasks(userId: string, limit = 10, skip = 0, filters: TaskFilters = {}) {
    const query: Record<string, unknown> = {
      assignedTo: userId,
    };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.search) {
      query.title = {
        $regex: filters.search,
        $options: 'i',
      };
    }

    if (filters.deadlineInDays) {
      const today = new Date();
      const endDate = new Date();
      endDate.setDate(today.getDate() + filters.deadlineInDays);

      query.deadline = {
        $gte: today,
        $lte: endDate,
      };
    }

    return this.taskModel
      .find(query)
      .populate('project', 'name')
      .limit(limit)
      .skip(skip);
  }

  async updateMyTaskStatus(
    taskId: string,
    userId: string,
    updateTaskStatusDto: UpdateTaskStatusDto,
  ) {
    const task = await this.taskModel.findOneAndUpdate(
      {
        _id: taskId,
        assignedTo: userId,
      },
      {
        status: updateTaskStatusDto.status,
      },
      {
        returnDocument: 'after',
      },
    );

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    this.logger.log(
      `Task status updated: ${task._id.toString()} - ${task.status}`,
    );

    return task;
  }
}
