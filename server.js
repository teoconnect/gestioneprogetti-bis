const express = require('express');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes

// Create User
app.post('/api/users', async (req, res) => {
  try {
    const { name, email, password, profileImage } = req.body;
    const user = await prisma.user.create({
      data: { name, email, password, profileImage },
    });
    res.status(201).json(user);
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
    const { title, description, status, priority, dueDate, budget, hoursSpent } = req.body;

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

    if (dueDate) {
      data.dueDate = new Date(dueDate);
    }

    const task = await prisma.task.create({ data });
    res.status(201).json(task);
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
