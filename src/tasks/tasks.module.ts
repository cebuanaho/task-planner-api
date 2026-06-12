import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { TasksController } from './tasks.controller';
import { Task, TaskSchema } from './tasks.schema';
import { TasksService } from './tasks.service';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      {
        name: Task.name,
        schema: TaskSchema,
      },
    ]),
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
