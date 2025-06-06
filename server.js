const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const examRoutes = require("./routes/examRoutes");
const mockTestRoutes = require("./routes/mockTestRoutes");
const registerStudentsRoute = require('./routes/registerStudents'); 
const salesRoutes = require('./routes/sales');
const taskRoutes = require('./routes/tasks');
const studentRoutes = require('./routes/studentRoutes');
const filterRoutes = require('./routes/get-all-filters');
const exportRoute = require('./routes/export');

dotenv.config();

const app = express();

// CORS configuration to allow multiple origins
const allowedOrigins = [
  'https://frontend-nine-theta-10.vercel.app',
  'http://localhost:3000'
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., mobile apps or curl) or from allowed origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow credentials (cookies, auth headers)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow necessary methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow necessary headers
  optionsSuccessStatus: 200 // For legacy browser support
};

app.use(express.json());
app.use(cors(corsOptions));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'Uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));
app.use('/api/download-logins', express.static(path.join(__dirname, 'generated-logins')));

// Mount all routes
app.use(exportRoute);
app.use(filterRoutes);
app.use('/api', authRoutes);
app.use('/admin', adminRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/mocktests', mockTestRoutes);
app.use('/api', studentRoutes);
app.use('/api', registerStudentsRoute);
app.use('/api', salesRoutes);
app.use('/api/tasks', taskRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');

    const Student = require('./models/Student');

    const collections = await mongoose.connection.db.listCollections().toArray();
    const studentCollectionExists = collections.some(col => col.name === 'students');

    if (studentCollectionExists) {
      try {
        await Student.collection.dropIndex("rollNo_1_schoolId_1");
        console.log("Old unique index dropped successfully");
      } catch (err) {
        if (err.codeName === "IndexNotFound") {
          console.log("Index does not exist, nothing to drop.");
        } else {
          console.error("Error dropping index:", err.message);
        }
      }
    } else {
      console.log("Collection 'students' does not exist, skipping index drop.");
    }
  })
  .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
