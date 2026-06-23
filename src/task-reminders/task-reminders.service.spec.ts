import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from '../mail/mail.service';
import { TasksService } from '../tasks/tasks.service';
import { TaskRemindersService } from './task-reminders.service';

describe('TaskRemindersService', () => {
  let service: TaskRemindersService;
  const tasksService = {
    findTasksForReminder: jest.fn(),
  };
  const mailService = {
    sendTaskReminder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskRemindersService,
        {
          provide: TasksService,
          useValue: tasksService,
        },
        {
          provide: MailService,
          useValue: mailService,
        },
      ],
    }).compile();

    service = module.get<TaskRemindersService>(TaskRemindersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send reminder mails by user email', async () => {
    tasksService.findTasksForReminder.mockResolvedValue([
      {
        title: 'First task',
        deadline: new Date('2026-01-01'),
        assignedTo: {
          email: 'user@mail.com',
        },
      },
      {
        title: 'Second task',
        assignedTo: {
          email: 'user@mail.com',
        },
      },
    ]);

    await service.sendDailyReminders();

    expect(tasksService.findTasksForReminder).toHaveBeenCalledWith(1);
    expect(mailService.sendTaskReminder).toHaveBeenCalledWith('user@mail.com', [
      {
        title: 'First task',
        deadline: new Date('2026-01-01'),
      },
      {
        title: 'Second task',
        deadline: undefined,
      },
    ]);
  });
});
