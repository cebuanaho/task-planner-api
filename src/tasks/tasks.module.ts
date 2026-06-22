import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Project, ProjectSchema } from '../projects/projects.schema';
import { TaskCommentsModule } from '../task-comments/task-comments.module';
import { TaskHistoryModule } from '../task-history/task-history.module';
import { User, UserSchema } from '../users/users.schema';
import { TasksController } from './tasks.controller';
import { Task, TaskSchema } from './tasks.schema';
import { TasksService } from './tasks.service';

@Module({
  imports: [
    AuthModule,
    TaskCommentsModule,
    TaskHistoryModule,
    MongooseModule.forFeature([
      {
        name: Task.name,
        schema: TaskSchema,
      },
      {
        name: Project.name,
        schema: ProjectSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
