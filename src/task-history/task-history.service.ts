import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TaskHistory, TaskHistoryDocument } from './task-history.schema';
import { TaskStatus } from '../tasks/tasks.schema';

@Injectable()
export class TaskHistoryService {
  constructor(
    @InjectModel(TaskHistory.name)
    private taskHistoryModel: Model<TaskHistoryDocument>,
  ) {}

  create(
    taskId: string,
    changedBy: string,
    oldStatus: TaskStatus,
    newStatus: TaskStatus,
  ) {
    return this.taskHistoryModel.create({
      task: new Types.ObjectId(taskId),
      changedBy: new Types.ObjectId(changedBy),
      oldStatus,
      newStatus,
    });
  }
}
