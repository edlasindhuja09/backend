const Task = require('../models/taskModel');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');


const processAttachments = (files) => {
    return files.map(file => ({
        name: file.originalname,
        url: `/uploads/${file.filename}`,
        type: path.extname(file.originalname).slice(1).toLowerCase()
    }));
};


exports.addTask = async (req, res) => {
    try {
        // Validate required fields
        if (!req.body.assignedTo) {
            return res.status(400).json({ message: 'assignedTo is required' });
        }

        const attachments = req.files ? req.files.map(file => ({
            name: file.originalname,
            url: `/uploads/${file.filename}`,
            type: file.mimetype.split('/')[1] || file.originalname.split('.').pop()
        })) : [];

        const newTask = new Task({
            title: req.body.title,
            description: req.body.description,
            assignedBy: req.body.assignedBy || 'Admin', // Default value
            assignedTo: req.body.assignedTo,
            assignedDate: req.body.assignedDate || new Date().toISOString(),
            dueDate: req.body.dueDate,
            priority: req.body.priority || 'medium',
            status: req.body.status || 'pending',
            attachments,
            schoolId: req.body.schoolId,
            schoolName: req.body.schoolName
        });

        await newTask.save();

        res.status(201).json(newTask);
    } catch (error) {
        console.error('Error adding task:', error);
        
        // Clean up uploaded files if error occurred
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                fs.unlink(file.path, (err) => {
                    if (err) console.error('Error deleting file:', err);
                });
            });
        }

        res.status(500).json({ 
            message: 'Internal Server Error',
            error: error.message 
        });
    }
};
// Get all tasks (filtered by assignedTo if provided)
exports.getAllTasks = async (req, res) => {
    try {
        const { assignedTo } = req.query;
        let query = {};
        
        if (assignedTo) {
            query.assignedTo = assignedTo;
        }

        const tasks = await Task.find(query).sort({ createdAt: -1 });
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Update a task by id
exports.updateTask = async (req, res) => {
    try {
        const taskId = req.params.id;
        
        // Validate task ID
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ message: 'Invalid task ID' });
        }

        const updateData = { ...req.body };
        
        // Process new attachments if any
        if (req.files && req.files.length > 0) {
            const newAttachments = processAttachments(req.files);
            updateData.$push = { attachments: { $each: newAttachments } };
        }

        const updatedTask = await Task.findByIdAndUpdate(
            taskId, 
            updateData, 
            { new: true, runValidators: true }
        );

        if (!updatedTask) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json(updatedTask);
    } catch (error) {
        console.error('Error updating task:', error);
        
        // Clean up uploaded files if error occurred
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                fs.unlink(file.path, (err) => {
                    if (err) console.error('Error deleting file:', err);
                });
            });
        }

        res.status(500).json({ 
            message: 'Internal Server Error',
            error: error.message 
        });
    }
};

// Delete a task by id
exports.deleteTask = async (req, res) => {
    try {
        const taskId = req.params.id;
        
        // Validate task ID
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ message: 'Invalid task ID' });
        }

        const task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Delete associated files
        if (task.attachments && task.attachments.length > 0) {
            task.attachments.forEach(attachment => {
                const filePath = path.join(__dirname, '..', 'uploads', path.basename(attachment.url));
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
        }

        await Task.findByIdAndDelete(taskId);
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ 
            message: 'Internal Server Error',
            error: error.message 
        });
    }
};
// Add comment to task
exports.addComment = async (req, res) => {
    try {
        const taskId = req.params.id;
        const { text, authorId, authorName, authorType } = req.body;

        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ message: 'Invalid task ID' });
        }

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const newComment = {
            text,
            authorId,
            authorName,
            authorType
        };

        task.comments.push(newComment);
        await task.save();

        res.status(201).json(task);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Get task with comments
exports.getTaskWithComments = async (req, res) => {
    try {
        const taskId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ message: 'Invalid task ID' });
        }

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json(task);
    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
