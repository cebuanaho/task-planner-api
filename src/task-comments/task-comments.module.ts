import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TaskComment, TaskCommentSchema } from './task-comment.schema';
import { TaskCommentsService } from './task-comments.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: TaskComment.name,
        schema: TaskCommentSchema,
      },
    ]),
  ],
  providers: [TaskCommentsService],
  exports: [TaskCommentsService],
})
export class TaskCommentsModule {}
