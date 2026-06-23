import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MailService } from '../mail/mail.service';
import { TasksService } from '../tasks/tasks.service';

type ReminderTask = {
  title: string;
  deadline?: Date;
  assignedTo: {
    email?: string;
  };
};

@Injectable()
export class TaskRemindersService {
  private readonly logger = new Logger(TaskRemindersService.name);

  constructor(
    private tasksService: TasksService,
    private mailService: MailService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendDailyReminders() {
    const tasks = (await this.tasksService.findTasksForReminder(
      1,
    )) as unknown as ReminderTask[];
    const tasksByEmail: Record<
      string,
      {
        title: string;
        deadline?: Date;
      }[]
    > = {};

    tasks.forEach((task) => {
      const email = task.assignedTo.email;

      if (!email) {
        return;
      }

      if (!tasksByEmail[email]) {
        tasksByEmail[email] = [];
      }

      tasksByEmail[email].push({
        title: task.title,
        deadline: task.deadline,
      });
    });

    for (const email of Object.keys(tasksByEmail)) {
      await this.mailService.sendTaskReminder(email, tasksByEmail[email]);
    }

    this.logger.log(`Task reminders checked: ${tasks.length} task`);
  }
}
