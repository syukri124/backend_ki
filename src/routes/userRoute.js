const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { verifyToken } = require("../middleware/auth");
const { requireRole } = require("../middleware/roleCheck");

// ADMIN role id = 1 (misalnya)
router.post("/create", verifyToken, requireRole([1]), userController.createUser);
router.get("/", verifyToken, requireRole([1]), userController.getAllUsers);

module.exports = router;
