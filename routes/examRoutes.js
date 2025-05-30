const express = require("express");
const router = express.Router();
const multer = require("multer");
const examController = require('../controllers/examController');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const ext = file.originalname.split(".").pop();
    cb(null, `${Date.now()}.${ext}`);
  },
});

const upload = multer({ storage });

router.post('/create', examController.createExam);
router.get('/', examController.getAllExams);
router.get('/:id', examController.getExamById);
router.delete('/:id', examController.deleteExam);
router.put('/:id', examController.updateExam);
router.patch('/:id/status', examController.toggleExamStatus);
// examRoutes.js
router.get('/featured', examController.getFeaturedExams);

module.exports = router;

