const express = require("express");
const User = require("../models/UserModel");
const AuditLog = require("../models/AuditLog");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// Get all users
router.get(
  "/users",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const users = await User.find().select("-password");

      res.json(users);
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch users",
      });
    }
  }
);

// Update user role
router.patch(
  "/users/:id/role",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { role } = req.body;

      if (!["user", "admin"].includes(role)) {
        return res.status(400).json({
          message: "Invalid role",
        });
      }

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true }
      ).select("-password");

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      await AuditLog.create({
        userId: req.user.id,
        action: `Changed role of ${user.email} to ${role}`,
        status: "success",
      });

      res.json({
        message: "User role updated successfully",
        user,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to update user role",
      });
    }
  }
);

// Get audit logs
router.get(
  "/audit-logs",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const logs = await AuditLog.find()
        .populate("userId", "name email")
        .sort({ timestamp: -1 });

      res.json(logs);
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch audit logs",
      });
    }
  }
);

module.exports = router;