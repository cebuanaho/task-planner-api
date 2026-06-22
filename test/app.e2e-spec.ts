import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import request from 'supertest';
import { App } from 'supertest/types';
import { Connection, Types } from 'mongoose';
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
  let userIds: string[];
  let projectIds: string[];
  let taskIds: string[];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    connection = moduleFixture.get<Connection>(getConnectionToken());

    await app.init();
  });

  beforeEach(() => {
    userIds = [];
    projectIds = [];
    taskIds = [];
  });

  afterEach(async () => {
    await connection.collection('tasks').deleteMany({
      _id: {
        $in: taskIds.map((id) => new Types.ObjectId(id)),
      },
    });

    await connection.collection('projects').deleteMany({
      _id: {
        $in: projectIds.map((id) => new Types.ObjectId(id)),
      },
    });

    await connection.collection('users').deleteMany({
      _id: {
        $in: userIds.map((id) => new Types.ObjectId(id)),
      },
    });
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

    userIds.push(adminRegisterBody.id, userRegisterBody.id);

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
    projectIds.push(projectBody._id);

    const taskResponse = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Test Task',
        description: 'E2E task',
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        project: projectBody._id,
        assignedTo: userRegisterBody.id,
      })
      .expect(201);

    const taskBody = taskResponse.body as TaskResponse;
    taskIds.push(taskBody._id);

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

    const filteredTasksResponse = await request(app.getHttpServer())
      .get('/tasks/my-tasks')
      .query({
        status: 'done',
        search: 'test',
        deadlineInDays: '3',
        limit: '5',
        skip: '0',
      })
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    const filteredTasksBody = filteredTasksResponse.body as TaskResponse[];

    expect(filteredTasksBody).toHaveLength(1);
    expect(filteredTasksBody[0]._id).toBe(taskBody._id);
  });

  it('checks basic auth and role rules', async () => {
    const testId = Date.now();
    const adminEmail = `admin-rules-${testId}@mail.com`;
    const userEmail = `user-rules-${testId}@mail.com`;
    const otherUserEmail = `other-user-rules-${testId}@mail.com`;

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

    const otherUserRegisterResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: otherUserEmail,
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

    const otherUserLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: otherUserEmail,
        password: '123456',
      })
      .expect(201);

    const adminRegisterBody = adminRegisterResponse.body as RegisterResponse;
    const userRegisterBody = userRegisterResponse.body as RegisterResponse;
    const otherUserRegisterBody =
      otherUserRegisterResponse.body as RegisterResponse;
    const adminLoginBody = adminLoginResponse.body as LoginResponse;
    const userLoginBody = userLoginResponse.body as LoginResponse;
    const otherUserLoginBody = otherUserLoginResponse.body as LoginResponse;

    const adminToken = adminLoginBody.accessToken;
    const userToken = userLoginBody.accessToken;
    const otherUserToken = otherUserLoginBody.accessToken;

    userIds.push(
      adminRegisterBody.id,
      userRegisterBody.id,
      otherUserRegisterBody.id,
    );

    await request(app.getHttpServer()).get('/tasks/my-tasks').expect(401);

    await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'User Project',
      })
      .expect(403);

    const projectResponse = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Rules Project',
      })
      .expect(201);

    const projectBody = projectResponse.body as ProjectResponse;
    projectIds.push(projectBody._id);

    await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'User Task Create',
        project: projectBody._id,
        assignedTo: userRegisterBody.id,
      })
      .expect(403);

    await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Missing Project Task',
        project: new Types.ObjectId().toString(),
        assignedTo: userRegisterBody.id,
      })
      .expect(404);

    await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Missing User Task',
        project: projectBody._id,
        assignedTo: new Types.ObjectId().toString(),
      })
      .expect(404);

    const taskResponse = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Rules Task',
        project: projectBody._id,
        assignedTo: userRegisterBody.id,
      })
      .expect(201);

    const taskBody = taskResponse.body as TaskResponse;
    taskIds.push(taskBody._id);

    await request(app.getHttpServer())
      .patch(`/tasks/${taskBody._id}/status`)
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send({
        status: 'done',
      })
      .expect(404);

    await request(app.getHttpServer())
      .patch(`/tasks/${taskBody._id}/status`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        status: 'wrong_status',
      })
      .expect(400);

    expect(adminRegisterBody.role).toBe('admin');
    expect(userRegisterBody.role).toBe('user');
  });
});
