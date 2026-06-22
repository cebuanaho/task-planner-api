import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Task } from '../tasks/tasks.schema';
import { User } from '../users/users.schema';

@Schema({ timestamps: true })
export class TaskAttachment {
  @Prop({ type: Types.ObjectId, ref: Task.name, required: true })
  task: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  uploadedBy: Types.ObjectId;

  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  path: string;

  @Prop({ required: true })
  mimetype: string;

  @Prop({ required: true })
  size: number;
}

export type TaskAttachmentDocument = HydratedDocument<TaskAttachment>;

export const TaskAttachmentSchema =
  SchemaFactory.createForClass(TaskAttachment);
