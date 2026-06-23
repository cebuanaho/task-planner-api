import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter?: Transporter;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('MAIL_HOST');

    if (!host) {
      return;
    }

    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASS');

    this.transporter = nodemailer.createTransport({
      host,
      port: this.configService.get<number>('MAIL_PORT') ?? 587,
      secure: false,
      auth:
        user && pass
          ? {
              user,
              pass,
            }
          : undefined,
    });
  }

  async sendTaskReminder(
    email: string,
    tasks: {
      title: string;
      deadline?: Date;
    }[],
  ) {
    const subject = 'Geciken Görevleriniz Var';
    const text = this.createReminderText(tasks);

    if (!this.transporter) {
      this.logger.log(`Mail skipped for ${email}: ${tasks.length} task`);
      return;
    }

    await this.transporter.sendMail({
      from:
        this.configService.get<string>('MAIL_FROM') ?? 'task-planner@mail.com',
      to: email,
      subject,
      text,
    });

    this.logger.log(`Reminder mail sent to ${email}`);
  }

  private createReminderText(
    tasks: {
      title: string;
      deadline?: Date;
    }[],
  ) {
    const taskLines = tasks.map((task) => {
      const deadline = task.deadline
        ? task.deadline.toISOString().split('T')[0]
        : 'deadline yok';

      return `- ${task.title} (${deadline})`;
    });

    return ['Yaklaşan veya geciken tasklarınız var:', '', ...taskLines].join(
      '\n',
    );
  }
}
