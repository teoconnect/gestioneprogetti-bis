const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const app = require('../server');

// Mock smtp_client
jest.mock('../smtp_client', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

const { sendEmail } = require('../smtp_client');

const prisma = new PrismaClient();

describe('App API Testing', () => {
  let createdUser;
  let token;
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Disconnect prisma after all tests
    await prisma.$disconnect();
  });

  it('should register a new user and send welcome email', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'securepassword'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toEqual('Test User');
    createdUser = res.body;

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(
      'testuser@example.com',
      'Welcome to Vivid Logic System',
      expect.any(String),
      expect.any(String)
    );
  });

  it('should login the user', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        email: 'testuser@example.com',
        password: 'securepassword'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toEqual('testuser@example.com');
    token = res.body.token;
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
    const startDate = new Date('2023-10-01').toISOString();
    const dueDate = new Date('2023-10-15').toISOString();

    const res = await request(app)
      .post(`/api/projects/${createdProject.id}/tasks`)
      .send({
        title: 'First Test Task',
        description: 'Testing task creation with budget',
        priority: 'High',
        budget: 1500.50,
        hoursSpent: 2.5,
        startDate: startDate,
        dueDate: dueDate
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toEqual('First Test Task');
    expect(res.body.budget).toEqual(1500.50);
    expect(res.body.hoursSpent).toEqual(2.5);
    expect(new Date(res.body.startDate).toISOString()).toEqual(startDate);
    expect(new Date(res.body.dueDate).toISOString()).toEqual(dueDate);
    expect(res.body.projectId).toEqual(createdProject.id);
    createdTask = res.body;
  });

  it('should update task dates (simulate Gantt move)', async () => {
    const newStartDate = new Date('2023-10-05').toISOString();
    const newDueDate = new Date('2023-10-20').toISOString();

    const res = await request(app)
      .put(`/api/tasks/${createdTask.id}`)
      .send({
        startDate: newStartDate,
        dueDate: newDueDate,
        status: 'In Progress'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('id', createdTask.id);
    expect(new Date(res.body.startDate).toISOString()).toEqual(newStartDate);
    expect(new Date(res.body.dueDate).toISOString()).toEqual(newDueDate);
    expect(res.body.status).toEqual('In Progress');
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
