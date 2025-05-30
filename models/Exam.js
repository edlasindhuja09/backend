const mongoose = require('mongoose');

const syllabusSchema = new mongoose.Schema({
  title: String,
  topics: [String],
});

const resourceSchema = new mongoose.Schema({
  title: String,
  items: [String],
});

const faqSchema = new mongoose.Schema({
  question: String,
  answer: String,
});

const examSchema = new mongoose.Schema({
  title: String,
  subject: String,
  description: String,
  date: String,
  registrationDeadline: String,
  duration: String,
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Easy',
  },
  eligibility: String,
  fee: String,
  location: String,
  image: String,
  syllabus: [syllabusSchema],
  resources: [resourceSchema],
  faqs: [faqSchema],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  featured: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);
