import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TaskStatus } from '../tasks/tasks.schema';
import { User } from '../users/users.schema';
import { Task } from '../tasks/tasks.schema';

@Schema({ timestamps: true })
export class TaskHistory {
  @Prop({ type: Types.ObjectId, ref: Task.name, required: true })
  task: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  changedBy: Types.ObjectId;

  @Prop({ required: true, enum: TaskStatus, type: String })
  oldStatus: TaskStatus;

  @Prop({ required: true, enum: TaskStatus, type: String })
  newStatus: TaskStatus;
}

export type TaskHistoryDocument = HydratedDocument<TaskHistory>;

export const TaskHistorySchema = SchemaFactory.createForClass(TaskHistory);
