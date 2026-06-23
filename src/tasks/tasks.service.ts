import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from '../projects/projects.schema';
import { TaskAttachmentsService } from '../task-attachments/task-attachments.service';
import { TaskCommentsService } from '../task-comments/task-comments.service';
import { TaskHistoryService } from '../task-history/task-history.service';
import { User, UserDocument, UserRole } from '../users/users.schema';
import { CreateTaskCommentDto } from './dto/create-task-comment.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { Task, TaskDocument, TaskStatus } from './tasks.schema';

type TaskFilters = {
  status?: TaskStatus;
  search?: string;
  deadlineInDays?: number;
};

type UploadedTaskFile = {
  originalname: string;
  filename: string;
  path: string;
  mimetype: string;
  size: number;
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
    private taskAttachmentsService: TaskAttachmentsService,
    private taskCommentsService: TaskCommentsService,
    private taskHistoryService: TaskHistoryService,
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

  private findTaskForUser(taskId: string, userId: string, role: UserRole) {
    if (role === UserRole.Admin) {
      return this.taskModel.findById(taskId);
    }

    return this.taskModel.findOne({
      _id: taskId,
      assignedTo: userId,
    });
  }

  async addComment(
    taskId: string,
    userId: string,
    role: UserRole,
    createTaskCommentDto: CreateTaskCommentDto,
  ) {
    const task = await this.findTaskForUser(taskId, userId, role);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.taskCommentsService.create(
      taskId,
      userId,
      createTaskCommentDto.text,
    );
  }

  async findComments(taskId: string, userId: string, role: UserRole) {
    const task = await this.findTaskForUser(taskId, userId, role);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.taskCommentsService.findByTask(taskId);
  }

  async addAttachment(
    taskId: string,
    userId: string,
    role: UserRole,
    file?: UploadedTaskFile,
  ) {
    const task = await this.findTaskForUser(taskId, userId, role);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.taskAttachmentsService.create(taskId, userId, {
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size,
    });
  }

  async findAttachments(taskId: string, userId: string, role: UserRole) {
    const task = await this.findTaskForUser(taskId, userId, role);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.taskAttachmentsService.findByTask(taskId);
  }

  async findOne(taskId: string, userId: string, role: UserRole) {
    const task = await this.findTaskForUser(taskId, userId, role);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task.populate([
      { path: 'project', select: 'name' },
      { path: 'assignedTo', select: 'email' },
    ]);
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

  findTasksForReminder(days = 1) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return this.taskModel
      .find({
        status: {
          $ne: TaskStatus.Done,
        },
        deadline: {
          $lte: endDate,
        },
      })
      .populate('assignedTo', 'email')
      .populate('project', 'name');
  }

  async updateMyTaskStatus(
    taskId: string,
    userId: string,
    updateTaskStatusDto: UpdateTaskStatusDto,
  ) {
    const oldTask = await this.taskModel.findOne({
      _id: taskId,
      assignedTo: userId,
    });

    if (!oldTask) {
      throw new NotFoundException('Task not found');
    }

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

    if (oldTask.status !== updateTaskStatusDto.status) {
      await this.taskHistoryService.create(
        taskId,
        userId,
        oldTask.status,
        updateTaskStatusDto.status,
      );
    }

    this.logger.log(
      `Task status updated: ${task._id.toString()} - ${task.status}`,
    );

    return task;
  }
}
