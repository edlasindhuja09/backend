// controllers/adminController.js
const User = require("../models/User");
const SalesUser = require("../models/SalesUser"); ;
const Student = require('../models/Student');// for salesusers collection


exports.getAllUsers = async (req, res) => {
  try {
    const { userType, search } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    let users = [];

    if (userType === "sales") {
      // Only fetch from SalesUser collection
      users = await SalesUser.find(filter);
    } else if (userType === "student") {
      // Fetch from Student collection
      users = await Student.find(filter);
    } else if (userType) {
      // Fetch from User collection based on userType
      filter.userType = userType;
      users = await User.find(filter);
    } else {
      // Fetch all types of users
      const [normalUsers, salesUsers, students] = await Promise.all([
        User.find(filter),
        SalesUser.find(filter).lean().then(sales => 
          sales.map(s => ({ ...s, userType: "sales" }))
        ),
        Student.find(filter).lean().then(students =>
          students.map(s => ({ ...s, userType: "student" }))
        )
      ]);
      users = [...normalUsers, ...salesUsers, ...students];
    }

    res.status(200).json({ users });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Server error" });
  }
};



exports.changeUserStatus = async (req, res) => {
  const { userId, status } = req.body;

  if (!["active", "inactive", "deactivated"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    // Try to update in all collections
    let user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    );

    if (!user) {
      user = await SalesUser.findByIdAndUpdate(
        userId,
        { status },
        { new: true }
      );
    }

    if (!user) {
      user = await Student.findByIdAndUpdate(
        userId,
        { status },
        { new: true }
      );
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: `User status changed to ${status}`, user });
  } catch (err) {
    console.error("Error changing user status:", err);
    res.status(500).json({ message: "Server error" });
  }
};
// Delete user

const mongoose = require("mongoose");

exports.deleteUser = async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID format" });
  }

  try {
    // Try to delete from all collections
    let result = await User.findByIdAndDelete(userId);
    
    if (!result) {
      result = await SalesUser.findByIdAndDelete(userId);
    }
    
    if (!result) {
      result = await Student.findByIdAndDelete(userId);
    }

    if (!result) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// controllers/adminController.js

exports.editUser = async (req, res) => {
  const { userId } = req.params;
  const updateData = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID format" });
  }

  try {
    // Try to update in all collections
    let updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );

    if (!updatedUser) {
      updatedUser = await SalesUser.findByIdAndUpdate(
        userId,
        updateData,
        { new: true }
      );
    }

    if (!updatedUser) {
      updatedUser = await Student.findByIdAndUpdate(
        userId,
        updateData,
        { new: true }
      );
    }

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ 
      message: "User updated successfully", 
      user: updatedUser 
    });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ message: "Server error" });
  }
};



