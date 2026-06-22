import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TaskAttachment, TaskAttachmentSchema } from './task-attachment.schema';
import { TaskAttachmentsService } from './task-attachments.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: TaskAttachment.name,
        schema: TaskAttachmentSchema,
      },
    ]),
  ],
  providers: [TaskAttachmentsService],
  exports: [TaskAttachmentsService],
})
export class TaskAttachmentsModule {}
