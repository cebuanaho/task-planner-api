import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { Project } from '../projects/projects.schema';
import { User } from '../users/users.schema';
import { Task, TaskStatus } from './tasks.schema';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;

  const taskModel = {
    create: jest.fn(),
    find: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };
  const projectModel = {
    findById: jest.fn(),
  };
  const userModel = {
    findById: jest.fn(),
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
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);

    jest.clearAllMocks();
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

    service.findMyTasks(userId);

    expect(taskModel.find).toHaveBeenCalledWith({
      assignedTo: userId,
    });
  });

  it('should update own task status', async () => {
    const taskId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();
    const task = {
      _id: new Types.ObjectId(taskId),
      status: TaskStatus.Done,
    };

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
    expect(result).toBe(task);
  });

  it('should throw not found when task does not belong to user', async () => {
    const taskId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();

    taskModel.findOneAndUpdate.mockResolvedValue(null);

    await expect(
      service.updateMyTaskStatus(taskId, userId, {
        status: TaskStatus.Done,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
