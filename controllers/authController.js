const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const SalesUser = require("../models/SalesUser");
const Student = require("../models/Student");

const JWT_SECRET = process.env.JWT_SECRET || "your_strong_jwt_secret_here";

// Helper function to generate token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      userType: user.userType,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Enhanced login controller
exports.loginUser = async (req, res) => {
  try {
    const { email, password, userType } = req.body;
    console.log(`Login attempt for ${email} as ${userType}`);

    const allowedUserTypes = ["student", "sales", "admin", "school"];
    if (!allowedUserTypes.includes(userType)) {
      return res.status(400).json({ message: "Invalid user type" });
    }

    // Find user based on type
    let user;
    switch (userType) {
      case "student":
        user = await Student.findOne({ email });
        break;
      case "sales":
        user = await SalesUser.findOne({ email });
        break;
      default:
        user = await User.findOne({ email, userType });
    }

    if (!user) {
      console.log("User not found");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check account status
    if (user.status !== "active") {
      return res.status(403).json({ 
        message: "Account is deactivated. Please contact support."
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Password mismatch");
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const olympiadExamName = user.olympiadExam || null;

    // Generate token
    const token = generateToken(user);

    // Successful login
    console.log(`User ${email} logged in successfully`);
    res.json({
      message: "Login successful",
      token,
      name: user.name,
      userId: user._id,
      userType: user.userType,
      olympiadExamName,
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
};

// Registration controller
exports.registerUser = async (req, res) => {
  try {
    const {
      userType,
      name,
      email,
      password,
      confirmPassword,
      phoneNumber,
      schoolName,
      schoolId,
      address
    } = req.body;

    const allowedUserTypes = ["student", "sales", "admin", "school"];
    if (!allowedUserTypes.includes(userType)) {
      return res.status(400).json({ message: "Invalid user type" });
    }

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    let existingUser;
    if (userType === "student") {
      existingUser = await Student.findOne({ email });
    } else if (userType === "sales") {
      existingUser = await SalesUser.findOne({ email });
    } else {
      existingUser = await User.findOne({ email, userType });
    }

    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      userType,
      name,
      email,
      password: hashedPassword,
      status: "active"
    };

    if (userType === "admin") {
      if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required for admin" });
      }
      userData.phoneNumber = phoneNumber;
    }

    if (userType === "school") {
      if (!schoolName || !schoolId || !address) {
        return res.status(400).json({ message: "All school details are required" });
      }
      userData.schoolName = schoolName;
      userData.schoolId = schoolId;
      userData.address = address;
    }

    let newUser;
    switch (userType) {
      case "student":
        newUser = new Student(userData);
        break;
      case "sales":
        newUser = new SalesUser(userData);
        break;
      default:
        newUser = new User(userData);
    }

    await newUser.save();

    const token = generateToken(newUser);

    res.status(201).json({
      message: "Registration successful",
      token,
      userId: newUser._id,
      userType: newUser.userType,
      name: newUser.name
    });

  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Server error during registration" });
  }
};
