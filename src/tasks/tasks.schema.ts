import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Project } from '../projects/projects.schema';
import { User } from '../users/users.schema';

export enum TaskStatus {
  NotStarted = 'not_started',
  InProgress = 'in_progress',
  Done = 'done',
}

@Schema({ timestamps: true })
export class Task {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop()
  deadline: Date;

  @Prop({
    required: true,
    enum: TaskStatus,
    default: TaskStatus.NotStarted,
  })
  status: TaskStatus;

  @Prop({ type: Types.ObjectId, ref: Project.name, required: true })
  project: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  assignedTo: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  createdBy: Types.ObjectId;
}

export type TaskDocument = HydratedDocument<Task>;

export const TaskSchema = SchemaFactory.createForClass(Task);
