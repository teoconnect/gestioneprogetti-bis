const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const app = require('../server');

const prisma = new PrismaClient();

describe('App API Testing', () => {
  let createdUser;
  let createdProject;
  let createdTask;

  beforeAll(async () => {
    // Clear out the database before starting tests
    await prisma.attachment.deleteMany({});
    await prisma.subtask.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    // Disconnect prisma after all tests
    await prisma.$disconnect();
  });

  it('should create a new user', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'securepassword'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toEqual('Test User');
    createdUser = res.body;
  });

  it('should create a new project for the user', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({
        title: 'New Test Project',
        description: 'A project for testing APIs',
        ownerId: createdUser.id
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toEqual('New Test Project');
    expect(res.body.ownerId).toEqual(createdUser.id);
    createdProject = res.body;
  });

  it('should create a new task with numeric fields for the project', async () => {
    const res = await request(app)
      .post(`/api/projects/${createdProject.id}/tasks`)
      .send({
        title: 'First Test Task',
        description: 'Testing task creation with budget',
        priority: 'High',
        budget: 1500.50,
        hoursSpent: 2.5
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toEqual('First Test Task');
    expect(res.body.budget).toEqual(1500.50);
    expect(res.body.hoursSpent).toEqual(2.5);
    expect(res.body.projectId).toEqual(createdProject.id);
    createdTask = res.body;
  });

  it('should create a subtask for the task', async () => {
    const res = await request(app)
      .post(`/api/tasks/${createdTask.id}/subtasks`)
      .send({
        title: 'Test Subtask 1',
        completed: false
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toEqual('Test Subtask 1');
    expect(res.body.completed).toEqual(false);
    expect(res.body.taskId).toEqual(createdTask.id);
  });

  it('should create an attachment for the task', async () => {
    const res = await request(app)
      .post(`/api/tasks/${createdTask.id}/attachments`)
      .send({
        fileName: 'test_doc.pdf',
        url: 'http://example.com/test_doc.pdf',
        fileType: 'application/pdf'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.fileName).toEqual('test_doc.pdf');
    expect(res.body.url).toEqual('http://example.com/test_doc.pdf');
    expect(res.body.taskId).toEqual(createdTask.id);
  });
});
