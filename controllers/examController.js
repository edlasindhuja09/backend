const Exam = require('../models/Exam');

// Create a new exam
exports.createExam = async (req, res) => {
  try {
    const exam = new Exam(req.body);
    await exam.save();
    
    // Convert to object and rename _id to id
    const examData = exam.toObject();
    examData.id = examData._id;
    delete examData._id;
    
    res.status(201).json({ message: 'Exam created successfully', exam: examData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all exams
exports.getAllExams = async (req, res) => {
  try {
    const exams = await Exam.find();
    const formattedExams = exams.map(exam => ({
      ...exam.toObject(),
      id: exam._id, // ✅ map _id to id
    }));
    res.status(200).json(formattedExams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single exam by ID
exports.getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.status(200).json(exam);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete an exam
exports.deleteExam = async (req, res) => {
  try {
    await Exam.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Exam deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// Update an existing exam
// Update an existing exam
exports.updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedExam = await Exam.findByIdAndUpdate(
      id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!updatedExam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    res.status(200).json({ 
      message: 'Exam updated successfully', 
      exam: updatedExam 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// Add this to your exam controller.js
exports.toggleExamStatus = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Toggle the status
    exam.status = exam.status === 'active' ? 'inactive' : 'active';
    await exam.save();

    res.status(200).json({ 
      message: 'Exam status updated successfully',
      exam: {
        ...exam.toObject(),
        id: exam._id
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// examController.js
exports.getFeaturedExams = async (req, res) => {
  try {
    const exams = await Exam.find({ featured: true, status: 'active' });
    const formattedExams = exams.map(exam => ({
      ...exam.toObject(),
      id: exam._id,
    }));
    res.status(200).json(formattedExams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};