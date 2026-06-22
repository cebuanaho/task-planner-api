import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  TaskAttachment,
  TaskAttachmentDocument,
} from './task-attachment.schema';

@Injectable()
export class TaskAttachmentsService {
  constructor(
    @InjectModel(TaskAttachment.name)
    private taskAttachmentModel: Model<TaskAttachmentDocument>,
  ) {}

  create(
    taskId: string,
    uploadedBy: string,
    file: {
      originalName: string;
      filename: string;
      path: string;
      mimetype: string;
      size: number;
    },
  ) {
    return this.taskAttachmentModel.create({
      task: new Types.ObjectId(taskId),
      uploadedBy: new Types.ObjectId(uploadedBy),
      ...file,
    });
  }

  findByTask(taskId: string) {
    return this.taskAttachmentModel.find({
      task: new Types.ObjectId(taskId),
    });
  }
}
