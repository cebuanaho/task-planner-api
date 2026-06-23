import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { TasksModule } from '../tasks/tasks.module';
import { TaskRemindersService } from './task-reminders.service';

@Module({
  imports: [TasksModule, MailModule],
  providers: [TaskRemindersService],
})
export class TaskRemindersModule {}
