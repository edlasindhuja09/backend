const express = require("express");
const router = express.Router();
const multer = require("multer");
const csvParser = require("csv-parser");
const fs = require("fs");
const bcrypt = require("bcrypt");
const Student = require("../models/Student");
const SalesUser = require("../models/SalesUser");
const User = require("../models/User");
const { Parser } = require("json2csv");
const path = require("path");

// Configure upload and generated folders
const generatedFolder = path.join(__dirname, '..', 'generated-logins');
if (!fs.existsSync(generatedFolder)) {
  fs.mkdirSync(generatedFolder, { recursive: true });
}

const upload = multer({ dest: "uploads/" });

// Improved password generator
function generateRandomPassword(length = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*";
  let pass = "";
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

// Enhanced student registration that allows duplicates
router.post("/register-students", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const results = await new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(req.file.path)
        .pipe(csvParser())
        .on("data", (data) => results.push(data))
        .on("end", () => resolve(results))
        .on("error", reject);
    });

    const studentsToInsert = [];
    const loginCredentials = [];
    const warnings = [];

    // Process each student
    for (const [index, student] of results.entries()) {
      try {
        const name = student.name?.trim() || "";
        const email = student.email?.trim().toLowerCase() || "";
        const rollNo = student.rollNo?.toString().trim() || ""; // Ensure rollNo is string
        const schoolName = student.schoolName?.trim() || "";
        const studentClass = student.class?.toString().trim() || student.grade?.toString().trim() || ""; // Handle both class and grade
        const olympiadExam = student.olympiadExam?.trim() || "";
        const feeStatus = student.feeStatus?.trim() || "Unpaid";
        const userType = student.userType?.trim() || "student";
        const schoolId = student.schoolId?.toString().trim() || req.body.schoolId?.toString().trim() || "unassigned";

        // Generate email if not provided
        const finalEmail = email || `${name.replace(/\s+/g, '').toLowerCase()}${rollNo}@${schoolName.replace(/\s+/g, '').toLowerCase()}.com`;

        // Validate required fields
        if (!name || !rollNo || !schoolName || !studentClass || !olympiadExam) {
          warnings.push(`Row ${index + 1}: Missing required fields - using default values where possible`);
        }

        // Generate secure credentials
        const rawPassword = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(rawPassword, 12);

        const studentData = {
          name,
          email: finalEmail,
          rollNo,
          schoolName,
          class: studentClass,
          olympiadExam,
          schoolId,
          password: hashedPassword,
          rawPassword,
          userType,
          feeStatus,
          status: "active",
          createdAt: new Date()
        };

        studentsToInsert.push(studentData);
        loginCredentials.push({
          ...studentData,
          password: rawPassword
        });
      } catch (err) {
        warnings.push(`Row ${index + 1}: ${err.message}`);
        console.log(`Warning for student: ${err.message}`);
      }
    }

    if (studentsToInsert.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        error: "No valid students found in file",
        details: warnings 
      });
    }

    // Insert all students without duplicate checking
    let insertedStudents = [];
    try {
      // Using insertMany with ordered:false to continue on errors
      insertedStudents = await Student.insertMany(studentsToInsert, { 
        ordered: false,
        rawResult: true 
      });
    } catch (err) {
      // Even if there are errors, some students may have been inserted
      if (err.result) {
        insertedStudents = err.result;
      } else {
        console.error("Bulk insert error:", err);
        throw err;
      }
    }

    // Generate credentials file for all attempted inserts
    const fields = ['name', 'email', 'rollNo', 'schoolName', 'class', 'olympiadExam', 'password', 'userType', 'feeStatus'];
    const opts = { fields };
    const csv = new Parser(opts).parse(loginCredentials);
    
    const filename = `student_credentials_${Date.now()}.csv`;
    const filePath = path.join(generatedFolder, filename);
    fs.writeFileSync(filePath, csv);

    fs.unlinkSync(req.file.path);
    
    return res.status(200).json({
      message: `Processed ${results.length} students, ${insertedStudents.insertedCount} inserted successfully`,
      totalProcessed: results.length,
      insertedCount: insertedStudents.insertedCount || 0,
      warningCount: warnings.length,
      warnings: warnings.length > 0 ? warnings : undefined,
      downloadUrl: `/api/download-logins/${filename}`
    });

  } catch (err) {
    fs.unlinkSync(req.file.path);
    console.error("Registration error:", err);
    return res.status(500).json({
      error: "Failed to process students",
      details: err.message,
    });
  }
});
router.get("/generate-csv", async (req, res) => {
  try {
    const { usertype, schoolname } = req.query;

    let query = {};
    if (usertype) query.userType = usertype;
    if (schoolname) query.schoolName = schoolname;

    let data, fields;

    if (usertype === 'sales') {
      // Handle sales users export
      data = await SalesUser.find(query).lean();
      fields = [
        'name',
        'email',
        'phone',
        'region',
        'createdAt'
      ];
    } else {
      // Handle student users export
      data = await Student.find(query).lean();
      fields = [
        'name',
        'email',
        'rollNo',
        'schoolName',
        'class',
        'olympiadExam',
        'feeStatus',
        'createdAt'
      ];
    }

    if (data.length === 0) {
      return res.status(404).send("No data found for the selected filters");
    }

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(data);

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${usertype || 'users'}_export_${Date.now()}.csv`);

    res.send(csv);

  } catch (err) {
    console.error("Export error:", err);
    res.status(500).send("Failed to generate export");
  }
});
// List generated CSV files
router.get("/download-logins/list", (req, res) => {
  fs.readdir(generatedFolder, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "Failed to list files" });
    }

    const fileStats = files.map((filename) => {
      const filePath = path.join(generatedFolder, filename);
      const stats = fs.statSync(filePath);
      return {
        name: filename,
        created: stats.ctime
      };
    });

    // Sort by newest first
    fileStats.sort((a, b) => b.created - a.created);
    res.json({ files: fileStats });
  });
});

// Serve CSV files
router.get("/download-logins/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(generatedFolder, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }

  res.download(filePath);
});

module.exports = router;