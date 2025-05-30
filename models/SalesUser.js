const mongoose = require("mongoose");

const SalesUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phoneNo: {
    type: String,
    required: true,
    trim: true
  },
  userType: {
    type: String,
    default: "sales",
    enum: ["sales"]
  },
  rawPassword: {
    type: String,
   
  },
  password: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: "active",
    enum: ["active", "inactive"]
  }
}, {
  timestamps: true,
 
});

// Add index for better query performance
SalesUserSchema.index({ email: 1 }, { unique: true });
SalesUserSchema.index({ userType: 1 });

module.exports = mongoose.model("SalesUser", SalesUserSchema);