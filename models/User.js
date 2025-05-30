const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  userType: {
    type: String,
    enum: ["school", "admin", "student", "sales"], // Added all user types
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
    default: null
  },
  address: { 
    type: String 
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

module.exports = mongoose.model("User", userSchema);