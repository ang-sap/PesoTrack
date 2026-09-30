const express = require("express");
const Notification = require("../models/Notification");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, async (req, res) => {
    try {
        const notifications = await Notification.find({
            userId: req.user.id
        }).sort({ createdAt: -1 });

        res.json(notifications);

    } catch (error) {
        res.status(500).json({
            message: "Failed to retrieve notifications"
        });
    }
});

router.patch("/:id/read", protect, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            {
                _id: req.params.id,
                userId: req.user.id
            },
            {
                status: "read"
            },
            {
                new: true
            }
        );

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found"
            });
        }

        res.json({
            message: "Notification marked as read",
            notification
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to update notification"
        });
    }
});

module.exports = router;