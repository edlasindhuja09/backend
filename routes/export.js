// routes/export.js
const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const { Parser } = require("json2csv");

router.post("/api/export", async (req, res) => {
  try {
    const { schoolname, userType } = req.body;

    // Apply filters only if provided
    const filter = {};
    if (schoolname) filter.schoolname = schoolname;
    if (userType) filter.userType = userType;

    const data = await Student.find(filter).lean();

    const fields = ["name", "schoolname", "userType", "email"]; // adjust as needed
    const parser = new Parser({ fields });
    const csv = parser.parse(data);

    res.header("Content-Type", "text/csv");
    res.attachment("students.csv");
    res.send(csv);
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ error: "Failed to generate export" });
  }
});

module.exports = router;
