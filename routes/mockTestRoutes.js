const express = require("express");
const router = express.Router();
const controller = require("../controllers/mockTestController");

router.get("/", controller.getAllMockTests);
router.get("/:id", controller.getMockTestById);
router.post("/", controller.createMockTest);

module.exports = router;
