const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const studentSchema = new mongoose.Schema({
  userType: {
    type: String,
    default: "student"
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  rawPassword: {
    type: String,
  },
  rollNo: {
    type: String,
    required: true
  },
  schoolName: {
    type: String,
    required: true
  },
  schoolId: {
    type: String,
    required: true, // Make this required to avoid null values
    default: "unassigned" // Default value instead of null
  },
  class: {
    type: String,
    required: true
  },
  olympiadExam: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'deactivated'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add non-unique compound index
studentSchema.index({ rollNo: 1, schoolId: 1 }, { unique: false });

module.exports = mongoose.model("Student", studentSchema);