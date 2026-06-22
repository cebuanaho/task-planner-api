import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Task } from '../tasks/tasks.schema';
import { User } from '../users/users.schema';

@Schema({ timestamps: true })
export class TaskComment {
  @Prop({ type: Types.ObjectId, ref: Task.name, required: true })
  task: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  text: string;
}

export type TaskCommentDocument = HydratedDocument<TaskComment>;

export const TaskCommentSchema = SchemaFactory.createForClass(TaskComment);
