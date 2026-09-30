const express = require("express");
const SavingsGoal = require("../models/SavingsGoal");
const AuditLog = require("../models/AuditLog");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


router.post("/", authMiddleware, async (req, res) => {
    try {
        const {
            name,
            targetAmount,
            targetDate
        } = req.body;

        if (!name || targetAmount === undefined || !targetDate) {
            return res.status(400).json({
                message: "Please complete all required fields"
            });
        }

        if (Number(targetAmount) <= 0) {
            return res.status(400).json({
                message: "Target amount must be greater than 0"
            });
        }

        if (new Date(targetDate) < new Date()) {
            return res.status(400).json({
                message: "Target date cannot be in the past"
            });
        }

        const goal = await SavingsGoal.create({
            userId: req.user.id,
            name,
            targetAmount: Number(targetAmount),
            currentAmount: 0,
            targetDate,
            status: "active"
        });

        await AuditLog.create({
            userId: req.user.id,
            action: `Created savings goal: ${name}`,
            status: "success"
        });

        res.status(201).json({
            message: "Savings goal created successfully",
            goal
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to create savings goal"
        });
    }
});


router.get("/", authMiddleware, async (req, res) => {
    try {
        const goals = await SavingsGoal.find({
            userId: req.user.id
        }).sort({
            createdAt: -1
        });

        const formattedGoals = goals.map((goal) => {
            const remaining = Math.max(
                goal.targetAmount - goal.currentAmount,
                0
            );

            const progress =
                goal.targetAmount > 0
                    ? Math.min(
                        (goal.currentAmount / goal.targetAmount) * 100,
                        100
                    )
                    : 0;

            return {
                ...goal.toObject(),
                remaining,
                progress: Number(progress.toFixed(2))
            };
        });

        res.json(formattedGoals);

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch savings goals"
        });
    }
});


router.patch("/:id", authMiddleware, async (req, res) => {
    try {
        const {
            name,
            targetAmount,
            targetDate
        } = req.body;

        const goal = await SavingsGoal.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!goal) {
            return res.status(404).json({
                message: "Savings goal not found"
            });
        }

        if (
            targetAmount !== undefined &&
            Number(targetAmount) <= 0
        ) {
            return res.status(400).json({
                message: "Target amount must be greater than 0"
            });
        }

        if (
            targetDate &&
            new Date(targetDate) < new Date()
        ) {
            return res.status(400).json({
                message: "Target date cannot be in the past"
            });
        }

        goal.name = name ?? goal.name;

        goal.targetAmount =
            targetAmount !== undefined
                ? Number(targetAmount)
                : goal.targetAmount;

        goal.targetDate =
            targetDate ?? goal.targetDate;

        if (goal.currentAmount >= goal.targetAmount) {
            goal.status = "completed";
        } else {
            goal.status = "active";
        }

        await goal.save();

        await AuditLog.create({
            userId: req.user.id,
            action: `Updated savings goal: ${goal.name}`,
            status: "success"
        });

        res.json({
            message: "Savings goal updated successfully",
            goal
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to update savings goal"
        });
    }
});


router.patch("/:id/add", authMiddleware, async (req, res) => {
    try {
        const {
            amount
        } = req.body;

        if (amount === undefined || Number(amount) <= 0) {
            return res.status(400).json({
                message: "Savings amount must be greater than 0"
            });
        }

        const goal = await SavingsGoal.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!goal) {
            return res.status(404).json({
                message: "Savings goal not found"
            });
        }

        if (goal.status === "completed") {
            return res.status(400).json({
                message: "This savings goal is already completed"
            });
        }

        goal.currentAmount += Number(amount);

        if (goal.currentAmount >= goal.targetAmount) {
            goal.currentAmount = goal.targetAmount;
            goal.status = "completed";
        }

        await goal.save();

        await AuditLog.create({
            userId: req.user.id,
            action: `Added ₱${Number(amount).toLocaleString()} to savings goal: ${goal.name}`,
            status: "success"
        });

        res.json({
            message: "Savings added successfully",
            goal
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to add savings"
        });
    }
});


router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const goal = await SavingsGoal.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!goal) {
            return res.status(404).json({
                message: "Savings goal not found"
            });
        }

        await AuditLog.create({
            userId: req.user.id,
            action: `Deleted savings goal: ${goal.name}`,
            status: "success"
        });

        res.json({
            message: "Savings goal deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to delete savings goal"
        });
    }
});


module.exports = router;