const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  userType: {
    type: String,
    enum: ["school", "admin"],
    required: true
  },
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true 
  },
  phoneNumber: { 
    type: String 
  },
  schoolName: { 
    type: String 
  },
  schoolId: { 
    type: String,
    default: null // Add default null
  },
  address: { 
    type: String 
  },
  rollNo: {
    type: String,
    default: null // Add default null
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

// Modify the index to be sparse
userSchema.index({ rollNo: 1, schoolId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("User", userSchema);