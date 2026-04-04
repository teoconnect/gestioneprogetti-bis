const express = require('express');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('./smtp_client');

const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

// API Routes

// Register User
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, profileImage } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, profileImage },
    });

    // Send welcome email
    try {
      await sendEmail(
        user.email,
        'Welcome to Vivid Logic System',
        `Hello ${user.name},\n\nWelcome to Vivid Logic System! Your account has been successfully created.`,
        `<h1>Welcome, ${user.name}!</h1><p>Your account has been successfully created.</p>`
      );
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // We don't fail the registration if the email fails, just log it.
    }

    res.status(201).json({ id: user.id, name: user.name, email: user.email });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create User (Legacy for tests, better to use /api/register)
app.post('/api/users', async (req, res) => {
  try {
    const { name, email, password, profileImage } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, profileImage },
    });
    res.status(201).json({ id: user.id, name: user.name, email: user.email });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create Project
app.post('/api/projects', async (req, res) => {
  try {
    const { title, description, status, progress, ownerId } = req.body;
    const project = await prisma.project.create({
      data: { title, description, status, progress, ownerId },
    });
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create Task
app.post('/api/projects/:projectId/tasks', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, status, priority, startDate, dueDate, budget, hoursSpent } = req.body;

    // Parse numeric/date fields appropriately if needed
    const data = {
      title,
      description,
      status,
      priority,
      budget: budget !== undefined ? parseFloat(budget) : null,
      hoursSpent: hoursSpent !== undefined ? parseFloat(hoursSpent) : 0,
      projectId
    };

    if (startDate) {
      data.startDate = new Date(startDate);
    }
    if (dueDate) {
      data.dueDate = new Date(dueDate);
    }

    const task = await prisma.task.create({ data });
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update Task (for Gantt and general updates)
app.put('/api/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, status, priority, startDate, dueDate, budget, hoursSpent } = req.body;

    const data = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (status !== undefined) data.status = status;
    if (priority !== undefined) data.priority = priority;
    if (budget !== undefined) data.budget = parseFloat(budget);
    if (hoursSpent !== undefined) data.hoursSpent = parseFloat(hoursSpent);

    if (startDate !== undefined) {
      data.startDate = startDate ? new Date(startDate) : null;
    }
    if (dueDate !== undefined) {
      data.dueDate = dueDate ? new Date(dueDate) : null;
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data,
    });
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create Subtask
app.post('/api/tasks/:taskId/subtasks', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, completed } = req.body;
    const subtask = await prisma.subtask.create({
      data: { title, completed: completed || false, taskId },
    });
    res.status(201).json(subtask);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create Attachment
app.post('/api/tasks/:taskId/attachments', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { fileName, url, fileType } = req.body;
    const attachment = await prisma.attachment.create({
      data: { fileName, url, fileType, taskId },
    });
    res.status(201).json(attachment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'screen1_task_detail.html'));
});

module.exports = app;
