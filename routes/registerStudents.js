const express = require("express"); 
const router = express.Router();
const multer = require("multer");
const csvParser = require("csv-parser");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const Student = require("../models/Student");
const SalesUser = require("../models/SalesUser");
const { Parser } = require("json2csv");
const path = require("path");

// Configure folders
const generatedFolder = path.join(__dirname, '..', 'generated-logins');
if (!fs.existsSync(generatedFolder)) {
  fs.mkdirSync(generatedFolder, { recursive: true });
}

const upload = multer({ 
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Enhanced password generator
function generateRandomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  return Array.from({length: 10}, () => 
    chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}

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

    const processedStudents = [];
    const loginCredentials = [];
    let successCount = 0;

    // Process all students without duplicate checking
    for (const [index, student] of results.entries()) {
      try {
        // Extract and validate fields
        const name = student.name?.trim();
        const rollNo = student.rollNo?.toString().trim();
        const schoolName = student.schoolName?.trim();
        const studentClass = student.class?.toString().trim() || student.grade?.toString().trim();
        const olympiadExam = student.olympiadExam?.trim();
        const email = student.email?.trim().toLowerCase();
        const schoolId = student.schoolId?.toString().trim() || req.body.schoolId?.toString().trim() || "unassigned";
        const userType = student.userType?.trim().toLowerCase() || "student";

        // Validate required fields (but allow registration even if missing)
        const missingFields = [];
        if (!name) missingFields.push("name");
        if (userType === "student" && !rollNo) missingFields.push("rollNo");
        if (userType === "student" && !schoolName) missingFields.push("schoolName");
        if (userType === "student" && !studentClass) missingFields.push("class");
        if (userType === "student" && !olympiadExam) missingFields.push("olympiadExam");

        // Generate final email
        const finalEmail = email || `${name?.replace(/\s+/g, '').toLowerCase() || 'user'}${rollNo || Date.now()}@${schoolName?.replace(/\s+/g, '').toLowerCase() || 'domain'}.com`;

        // Generate credentials
        const rawPassword = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(rawPassword, 12);

        // Create document based on user type
        let result;
        if (userType === "sales") {
          const salesDoc = {
            name: name || `Sales User ${index + 1}`,
            email: finalEmail,
            phoneNo: student.phoneNo?.toString().trim() || "0000000000",
            userType: "sales",
            password: hashedPassword,
            rawPassword,
            status: "active",
            createdAt: new Date()
          };
          result = await SalesUser.collection.insertOne(salesDoc);
          
          loginCredentials.push({
            name: salesDoc.name,
            email: salesDoc.email,
            phoneNo: salesDoc.phoneNo,
            userType: salesDoc.userType,
            password: rawPassword
          });
        } else {
          // Default to student
          const studentDoc = {
            name: name || `Student ${index + 1}`,
            email: finalEmail,
            rollNo: rollNo || `${index + 1}`,
            schoolName: schoolName || "Unknown School",
            class: studentClass || "1",
            olympiadExam: olympiadExam || "General",
            schoolId,
            password: hashedPassword,
            rawPassword,
            userType: "student",
            feeStatus: student.feeStatus?.trim() || "Unpaid",
            status: "active",
            createdAt: new Date(),
            missingFields: missingFields.length > 0 ? missingFields : undefined
          };
          result = await Student.collection.insertOne(studentDoc);
          
          loginCredentials.push({
            name: studentDoc.name,
            email: studentDoc.email,
            rollNo: studentDoc.rollNo,
            schoolName: studentDoc.schoolName,
            class: studentDoc.class,
            olympiadExam: studentDoc.olympiadExam,
            userType: studentDoc.userType,
            password: rawPassword,
            missingFields: studentDoc.missingFields
          });
        }

        successCount++;
        processedStudents.push({
          row: index + 1,
          status: "success",
          data: userType === "sales" ? {
            name: name,
            email: finalEmail,
            phoneNo: student.phoneNo,
            userType: "sales"
          } : {
            name: name,
            email: finalEmail,
            rollNo: rollNo,
            schoolName: schoolName,
            class: studentClass,
            olympiadExam: olympiadExam,
            userType: "student"
          },
          userId: result.insertedId
        });

      } catch (err) {
        processedStudents.push({
          row: index + 1,
          status: "failed",
          error: err.message,
          data: student
        });
      }
    }

    // Generate CSV with appropriate fields based on user type
    let fields, csv;
    if (loginCredentials.some(cred => cred.userType === "sales")) {
      // Mixed or sales users
      fields = [
        'name', 'email', 'userType', 'password',
        {label: 'Phone', value: 'phoneNo', default: 'N/A'},
        {label: 'Roll No', value: 'rollNo', default: 'N/A'},
        {label: 'School', value: 'schoolName', default: 'N/A'},
        {label: 'Class', value: 'class', default: 'N/A'},
        {label: 'Olympiad', value: 'olympiadExam', default: 'N/A'}
      ];
    } else {
      // Only students
      fields = [
        'name', 'email', 'rollNo', 'schoolName', 
        'class', 'olympiadExam', 'userType', 'password'
      ];
    }

    const json2csvParser = new Parser({ fields });
    csv = json2csvParser.parse(loginCredentials);
    
    const filename = `user_credentials_${Date.now()}.csv`;
    const filePath = path.join(generatedFolder, filename);
    fs.writeFileSync(filePath, csv);

    fs.unlinkSync(req.file.path);

    return res.json({
      message: `Processed ${results.length} users`,
      total: results.length,
      successCount,
      errorCount: results.length - successCount,
      downloadUrl: `/api/download-logins/${filename}`,
      processedStudents
    });

  } catch (err) {
    if (req.file?.path) fs.unlinkSync(req.file.path);
    console.error("Registration error:", err);
    return res.status(500).json({
      error: "Failed to process users",
      details: err.message
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
      data = await SalesUser.find(query).lean();
      fields = [
        'name',
        'email',
        'phoneNo',
        'userType',
        'rawPassword',
        'status',
        'createdAt'
      ];
    } else {
      data = await Student.find(query).lean();
      fields = [
        'name',
        'email',
        'rollNo',
        'schoolName',
        'class',
        'olympiadExam',
        'userType',
        'rawPassword',
        'feeStatus',
        'createdAt'
      ];
    }

    if (data.length === 0) {
      return res.status(404).send("No data found for the selected filters");
    }

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(data);

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