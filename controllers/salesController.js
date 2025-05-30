const SalesUser = require('../models/SalesUser');
const csv = require('csv-parser');
const fs = require('fs');
const bcrypt = require('bcrypt');

exports.uploadSalesCSV = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    const results = [];
    const errors = [];
    
    // Process CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => {
          // Normalize data and validate required fields
          if (data.name && data.email && (data.phoneNo || data['phone no'])) {
            results.push({
              name: (data.name || '').toString().trim(),
              email: (data.email || '').toString().trim().toLowerCase(),
              phoneNo: (data.phoneNo || data['phone no'] || '').toString().trim()
            });
          } else {
            errors.push({
              row: data,
              error: "Missing required fields (name, email, or phone number)"
            });
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    if (results.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        message: "No valid records found in CSV",
        errors
      });
    }

    // Process users with password generation
    const usersWithPasswords = await Promise.all(
      results.map(async (user) => {
        const rawPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(rawPassword, 10);
        return {
          ...user,
          userType: 'sales',
          rawPassword,
          password: hashedPassword,
          status: 'active'
        };
      })
    );

    // Insert users with better error handling
    let insertedCount = 0;
    const insertedUsers = [];
    const duplicateEmails = [];

    for (const user of usersWithPasswords) {
      try {
        const existingUser = await SalesUser.findOne({ email: user.email });
        if (existingUser) {
          duplicateEmails.push(user.email);
          continue;
        }

        const newUser = await SalesUser.create(user);
        insertedUsers.push(newUser);
        insertedCount++;
      } catch (err) {
        if (err.code === 11000) { // Duplicate key error
          duplicateEmails.push(user.email);
        } else {
          console.error(`Error inserting user ${user.email}:`, err);
          errors.push({
            email: user.email,
            error: err.message
          });
        }
      }
    }

    fs.unlinkSync(req.file.path);

    // Prepare response
    const response = {
      message: `Processed ${results.length} records`,
      inserted: insertedCount,
      duplicates: duplicateEmails.length,
      errors: errors.length,
      credentials: insertedUsers.map(user => ({
        email: user.email,
        password: user.rawPassword
      }))
    };

    if (duplicateEmails.length > 0) {
      response.duplicateEmails = duplicateEmails;
    }

    if (errors.length > 0) {
      response.errorDetails = errors;
    }

    return res.status(200).json(response);

  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error("Unexpected error:", error);
    return res.status(500).json({ 
      message: "Unexpected server error",
      error: error.message 
    });
  }
};