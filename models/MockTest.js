const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  text: String,
  options: [String],
  answer: Number,
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
  },
});

const mockTestSchema = new mongoose.Schema({
  title: String,
  subject: String,
  duration: Number, // in minutes
  instructions: [String],
  totalQuestions: Number,
  questions: [questionSchema],
});

module.exports = mongoose.model("MockTest", mockTestSchema);
