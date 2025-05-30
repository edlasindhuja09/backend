const MockTest = require("../models/mockTest");

// Get all mock tests
exports.getAllMockTests = async (req, res) => {
  try {
    const tests = await MockTest.find();
    res.json(tests);
  } catch (error) {
    res.status(500).json({ error: "Failed to get tests" });
  }
};

// Get a single mock test
exports.getMockTestById = async (req, res) => {
  try {
    const test = await MockTest.findById(req.params.id);
    if (!test) return res.status(404).json({ error: "Test not found" });
    res.json(test);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch the test" });
  }
};

// Create a mock test
exports.createMockTest = async (req, res) => {
  try {
    const newTest = new MockTest(req.body);
    await newTest.save();
    res.status(201).json(newTest);
  } catch (error) {
    res.status(400).json({ error: "Failed to create test" });
  }
};
