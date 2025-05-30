// server.js
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
const salesRoutes = require('./routes/sales'); // ✅ added
const taskRoutes = require('./routes/tasks');
const studentRoutes = require('./routes/studentRoutes');
const filterRoutes = require('./routes/get-all-filters');
const exportRoute = require('./routes/export');

dotenv.config();

const app = express();
const corsOptions = {
  origin: 'http://localhost:3000', // Your frontend origin
  credentials: true, // Allow credentials
  optionsSuccessStatus: 200 // For legacy browser support
};
app.use(express.json());
app.use(cors(corsOptions));
// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}



// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
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
app.use('/api', salesRoutes); // ✅ added
app.use('/api/tasks', taskRoutes);


// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/olympiad', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch((err) => console.error('MongoDB connection error:', err));

// Start server
app.listen(5000, () => {
  console.log('Server running on port 5000');
});
