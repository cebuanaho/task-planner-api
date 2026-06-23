import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { Project } from '../projects/projects.schema';
import { TaskAttachmentsService } from '../task-attachments/task-attachments.service';
import { TaskCommentsService } from '../task-comments/task-comments.service';
import { TaskHistoryService } from '../task-history/task-history.service';
import { User, UserRole } from '../users/users.schema';
import { Task, TaskStatus } from './tasks.schema';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;
  const taskQuery = {
    populate: jest.fn(),
    limit: jest.fn(),
    skip: jest.fn(),
  };

  const taskModel = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };
  const projectModel = {
    findById: jest.fn(),
  };
  const userModel = {
    findById: jest.fn(),
  };
  const taskHistoryService = {
    create: jest.fn(),
  };
  const taskCommentsService = {
    create: jest.fn(),
    findByTask: jest.fn(),
  };
  const taskAttachmentsService = {
    create: jest.fn(),
    findByTask: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getModelToken(Task.name),
          useValue: taskModel,
        },
        {
          provide: getModelToken(Project.name),
          useValue: projectModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: userModel,
        },
        {
          provide: TaskCommentsService,
          useValue: taskCommentsService,
        },
        {
          provide: TaskAttachmentsService,
          useValue: taskAttachmentsService,
        },
        {
          provide: TaskHistoryService,
          useValue: taskHistoryService,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);

    jest.clearAllMocks();

    taskQuery.populate.mockReturnValue(taskQuery);
    taskQuery.limit.mockReturnValue(taskQuery);
    taskQuery.skip.mockReturnValue(taskQuery);
  });

  it('should create a task', async () => {
    const adminId = new Types.ObjectId().toString();
    const projectId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();
    const taskId = new Types.ObjectId();

    const createTaskDto = {
      title: 'Test Task',
      project: projectId,
      assignedTo: userId,
    };

    const task = {
      _id: taskId,
      ...createTaskDto,
      createdBy: adminId,
      status: TaskStatus.NotStarted,
    };

    projectModel.findById.mockResolvedValue({ _id: projectId });
    userModel.findById.mockResolvedValue({ _id: userId });
    taskModel.create.mockResolvedValue(task);

    const result = await service.create(createTaskDto, adminId);

    expect(taskModel.create).toHaveBeenCalledWith({
      ...createTaskDto,
      createdBy: adminId,
    });
    expect(result).toBe(task);
  });

  it('should add a comment to own task', async () => {
    const taskId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();
    const task = {
      _id: new Types.ObjectId(taskId),
    };
    const comment = {
      _id: new Types.ObjectId(),
      text: 'Looks good',
    };

    taskModel.findOne.mockResolvedValue(task);
    taskCommentsService.create.mockResolvedValue(comment);

    const result = await service.addComment(taskId, userId, UserRole.User, {
      text: 'Looks good',
    });

    expect(taskModel.findOne).toHaveBeenCalledWith({
      _id: taskId,
      assignedTo: userId,
    });
    expect(taskCommentsService.create).toHaveBeenCalledWith(
      taskId,
      userId,
      'Looks good',
    );
    expect(result).toBe(comment);
  });

  it('should add an attachment to own task', async () => {
    const taskId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();
    const task = {
      _id: new Types.ObjectId(taskId),
    };
    const attachment = {
      _id: new Types.ObjectId(),
      originalName: 'test.pdf',
    };

    taskModel.findOne.mockResolvedValue(task);
    taskAttachmentsService.create.mockResolvedValue(attachment);

    const result = await service.addAttachment(taskId, userId, UserRole.User, {
      originalname: 'test.pdf',
      filename: 'test-file.pdf',
      path: 'uploads/test-file.pdf',
      mimetype: 'application/pdf',
      size: 100,
    });

    expect(taskModel.findOne).toHaveBeenCalledWith({
      _id: taskId,
      assignedTo: userId,
    });
    expect(taskAttachmentsService.create).toHaveBeenCalledWith(taskId, userId, {
      originalName: 'test.pdf',
      filename: 'test-file.pdf',
      path: 'uploads/test-file.pdf',
      mimetype: 'application/pdf',
      size: 100,
    });
    expect(result).toBe(attachment);
  });

  it('should throw not found when project does not exist', async () => {
    const adminId = new Types.ObjectId().toString();
    const projectId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();

    projectModel.findById.mockResolvedValue(null);

    await expect(
      service.create(
        {
          title: 'Test Task',
          project: projectId,
          assignedTo: userId,
        },
        adminId,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw not found when assigned user does not exist', async () => {
    const adminId = new Types.ObjectId().toString();
    const projectId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();

    projectModel.findById.mockResolvedValue({ _id: projectId });
    userModel.findById.mockResolvedValue(null);

    await expect(
      service.create(
        {
          title: 'Test Task',
          project: projectId,
          assignedTo: userId,
        },
        adminId,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('should find tasks assigned to user', () => {
    const userId = new Types.ObjectId().toString();

    taskModel.find.mockReturnValue(taskQuery);

    service.findMyTasks(userId, 5, 10, {
      status: TaskStatus.InProgress,
      search: 'api',
      deadlineInDays: 3,
    });

    expect(taskModel.find).toHaveBeenCalledWith(
      expect.objectContaining({
        assignedTo: userId,
        status: TaskStatus.InProgress,
        title: {
          $regex: 'api',
          $options: 'i',
        },
      }),
    );
    expect(taskQuery.populate).toHaveBeenCalledWith('project', 'name');
    expect(taskQuery.limit).toHaveBeenCalledWith(5);
    expect(taskQuery.skip).toHaveBeenCalledWith(10);
  });

  it('should update own task status', async () => {
    const taskId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();
    const task = {
      _id: new Types.ObjectId(taskId),
      status: TaskStatus.Done,
    };
    const oldTask = {
      _id: new Types.ObjectId(taskId),
      status: TaskStatus.NotStarted,
    };

    taskModel.findOne.mockResolvedValue(oldTask);
    taskModel.findOneAndUpdate.mockResolvedValue(task);

    const result = await service.updateMyTaskStatus(taskId, userId, {
      status: TaskStatus.Done,
    });

    expect(taskModel.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: taskId,
        assignedTo: userId,
      },
      {
        status: TaskStatus.Done,
      },
      {
        returnDocument: 'after',
      },
    );
    expect(taskHistoryService.create).toHaveBeenCalledWith(
      taskId,
      userId,
      TaskStatus.NotStarted,
      TaskStatus.Done,
    );
    expect(result).toBe(task);
  });

  it('should throw not found when task does not belong to user', async () => {
    const taskId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();

    taskModel.findOne.mockResolvedValue(null);

    await expect(
      service.updateMyTaskStatus(taskId, userId, {
        status: TaskStatus.Done,
      }),
    ).rejects.toThrow(NotFoundException);
    expect(taskModel.findOneAndUpdate).not.toHaveBeenCalled();
  });
});
