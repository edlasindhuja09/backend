const express = require('express');
const router = express.Router();
const User = require('../models/User'); // adjust path as needed

// Get school by ID (only users with userType 'school')
router.get('/:id', async (req, res) => {
  try {
    const school = await User.findOne({ _id: req.params.id, userType: 'school' });
    if (!school) return res.status(404).json({ message: 'School not found' });
    res.json(school);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all schools
router.get('/', async (req, res) => {
  try {
    const schools = await User.find({ userType: 'school' });
    res.json(schools);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/:id/students', async (req, res) => {
  try {
    const students = await User.find({ userType: 'student', schoolId: req.params.id });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
