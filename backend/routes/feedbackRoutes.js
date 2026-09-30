const express = require("express");

const Feedback = require("../models/Feedback");
const AuditLog = require("../models/AuditLog");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();


/*
    USER
    Submit feedback
*/
router.post("/", authMiddleware, async (req, res) => {
    try {
        const {
            type,
            subject,
            message
        } = req.body;

        if (!type || !subject || !message) {
            return res.status(400).json({
                message: "Please complete all feedback fields"
            });
        }

        const feedback = await Feedback.create({
            userId: req.user.id,
            type,
            subject,
            message
        });

        await AuditLog.create({
            userId: req.user.id,
            action: `Submitted feedback: ${subject}`,
            status: "success"
        });

        res.status(201).json({
            message: "Feedback submitted successfully",
            feedback
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to submit feedback"
        });
    }
});


/*
    USER
    Get own feedback
*/
router.get("/mine", authMiddleware, async (req, res) => {
    try {
        const feedback = await Feedback.find({
            userId: req.user.id
        }).sort({
            createdAt: -1
        });

        res.json(feedback);

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch feedback"
        });
    }
});


/*
    ADMIN
    Get all feedback
*/
router.get(
    "/admin",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const feedback = await Feedback.find()
                .populate("userId", "name email")
                .sort({
                    createdAt: -1
                });

            res.json(feedback);

        } catch (error) {
            res.status(500).json({
                message: "Failed to fetch feedback"
            });
        }
    }
);


/*
    ADMIN
    Update feedback status
*/
router.patch(
    "/admin/:id/status",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const {
                status
            } = req.body;

            if (
                ![
                    "New",
                    "Reviewed",
                    "Resolved"
                ].includes(status)
            ) {
                return res.status(400).json({
                    message: "Invalid feedback status"
                });
            }

            const feedback = await Feedback.findById(
                req.params.id
            );

            if (!feedback) {
                return res.status(404).json({
                    message: "Feedback not found"
                });
            }

            feedback.status = status;

            await feedback.save();

            await AuditLog.create({
                userId: req.user.id,
                action: `Changed feedback "${feedback.subject}" status to ${status}`,
                status: "success"
            });

            res.json({
                message: "Feedback status updated successfully",
                feedback
            });

        } catch (error) {
            console.error(error);

            res.status(500).json({
                message: "Failed to update feedback status"
            });
        }
    }
);


module.exports = router;