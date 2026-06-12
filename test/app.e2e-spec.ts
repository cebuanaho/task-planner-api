import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import request from 'supertest';
import { App } from 'supertest/types';
import { Connection } from 'mongoose';
import { AppModule } from './../src/app.module';

type RegisterResponse = {
  id: string;
  role: string;
};

type LoginResponse = {
  accessToken: string;
};

type ProjectResponse = {
  _id: string;
};

type TaskResponse = {
  _id: string;
  status: string;
};

describe('Task planner API (e2e)', () => {
  let app: INestApplication<App>;
  let connection: Connection;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );

    connection = moduleFixture.get<Connection>(getConnectionToken());

    await app.init();
  });

  afterAll(async () => {
    await connection.close();
    await app.close();
  });

  it('registers, logs in, creates project, creates task and updates status', async () => {
    const testId = Date.now();
    const adminEmail = `admin-${testId}@mail.com`;
    const userEmail = `user-${testId}@mail.com`;

    const adminRegisterResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: adminEmail,
        password: '123456',
        role: 'admin',
      })
      .expect(201);

    const userRegisterResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: userEmail,
        password: '123456',
      })
      .expect(201);

    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: adminEmail,
        password: '123456',
      })
      .expect(201);

    const userLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: userEmail,
        password: '123456',
      })
      .expect(201);

    const adminRegisterBody = adminRegisterResponse.body as RegisterResponse;
    const userRegisterBody = userRegisterResponse.body as RegisterResponse;
    const adminLoginBody = adminLoginResponse.body as LoginResponse;
    const userLoginBody = userLoginResponse.body as LoginResponse;

    const adminToken = adminLoginBody.accessToken;
    const userToken = userLoginBody.accessToken;

    expect(adminRegisterBody.role).toBe('admin');
    expect(userRegisterBody.role).toBe('user');
    expect(adminToken).toBeDefined();
    expect(userToken).toBeDefined();

    const projectResponse = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Project',
        description: 'E2E project',
      })
      .expect(201);

    const projectBody = projectResponse.body as ProjectResponse;

    const taskResponse = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Test Task',
        description: 'E2E task',
        project: projectBody._id,
        assignedTo: userRegisterBody.id,
      })
      .expect(201);

    const taskBody = taskResponse.body as TaskResponse;

    expect(taskBody.status).toBe('not_started');

    const myTasksResponse = await request(app.getHttpServer())
      .get('/tasks/my-tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    const myTasksBody = myTasksResponse.body as TaskResponse[];

    expect(myTasksBody).toHaveLength(1);
    expect(myTasksBody[0]._id).toBe(taskBody._id);

    const statusResponse = await request(app.getHttpServer())
      .patch(`/tasks/${taskBody._id}/status`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        status: 'done',
      })
      .expect(200);

    const statusBody = statusResponse.body as TaskResponse;

    expect(statusBody.status).toBe('done');
  });
});
