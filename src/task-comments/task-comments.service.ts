import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TaskComment, TaskCommentDocument } from './task-comment.schema';

@Injectable()
export class TaskCommentsService {
  constructor(
    @InjectModel(TaskComment.name)
    private taskCommentModel: Model<TaskCommentDocument>,
  ) {}

  create(taskId: string, userId: string, text: string) {
    return this.taskCommentModel.create({
      task: new Types.ObjectId(taskId),
      user: new Types.ObjectId(userId),
      text,
    });
  }

  findByTask(taskId: string) {
    return this.taskCommentModel
      .find({
        task: new Types.ObjectId(taskId),
      })
      .populate('user', 'email');
  }
}
