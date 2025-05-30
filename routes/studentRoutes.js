// routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
// In your studentRoutes.js
router.get('/', async (req, res) => {
  try {
    const students = await Student.find({});
    res.json({ students }); // Or just res.json(students) depending on your frontend expectation
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});
// Get filter options
router.get('/student-filters', async (req, res) => {
  try {
    const schools = await Student.distinct('schoolName');
    const normalizedSchools = [...new Set(schools.map(s => s.trim().toLowerCase()))].sort();
    const userTypes = await Student.distinct('userType');
    
    res.json({
      schools: schools.filter(Boolean).sort(),
      userTypes: userTypes.filter(Boolean).sort()
    });
  } catch (err) {
    console.error('Error fetching filter options:', err);
    res.status(500).json({ error: 'Failed to fetch filter options' });
  }
});
// GET /api/student-dashboard/:email
router.get('/student-dashboard/:email', async (req, res) => {
  const email = req.params.email;

  try {
    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    console.error('Error fetching student data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;