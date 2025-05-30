// get-all-filters.js
const express = require("express");
const router = express.Router();
const Student = require("../models/Student");

router.get("/api/get-all-filters", async (req, res) => {
  try {
    const schoolnames = await Student.distinct("schoolname");
    const userTypes = await Student.distinct("userType");
    res.json({ schoolnames, userTypes });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch filters" });
  }
});

module.exports = router;
