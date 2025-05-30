const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const taskController = require('../controllers/taskcontroller');

// Get all tasks
router.get('/', taskController.getAllTasks);

// Add new task
router.post('/', upload.array('attachments'), taskController.addTask);

// Update a task
router.put('/:id', upload.array('attachments'), taskController.updateTask);

// Delete a task
router.delete('/:id', taskController.deleteTask);

// New comment routes
router.post('/:id/comments', taskController.addComment);
router.get('/:id', taskController.getTaskWithComments);
module.exports = router;