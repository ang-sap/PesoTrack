const express = require("express");
const Transaction = require("../models/Transaction");
const Revision = require("../models/Revision");
const AuditLog = require("../models/AuditLog");
const Notification = require("../models/Notification");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
    try {
        const {
            type,
            category,
            amount,
            description,
            date
        } = req.body;

        if (!type || !category || amount === undefined || amount === null) {
            return res.status(400).json({
                message: "Please complete all required transaction fields"
            });
        }

        if (!["income", "expense"].includes(type)) {
            return res.status(400).json({
                message: "Invalid transaction type"
            });
        }

        if (Number(amount) <= 0) {
            return res.status(400).json({
                message: "Amount must be greater than 0"
            });
        }

        const transaction = await Transaction.create({
            userId: req.user.id,
            type,
            category,
            amount: Number(amount),
            description: description || "",
            date: date || new Date()
        });

        res.status(201).json(transaction);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to create transaction"
        });
    }
});


router.get("/", authMiddleware, async (req, res) => {
    try {
        const transactions = await Transaction.find({
            userId: req.user.id
        }).sort({ date: -1, createdAt: -1 });

        res.json(transactions);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch transactions"
        });
    }
});


router.patch("/:id", authMiddleware, async (req, res) => {
    try {
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!transaction) {
            return res.status(404).json({
                message: "Transaction not found"
            });
        }

        const allowedFields = [
            "type",
            "category",
            "amount",
            "description",
            "date"
        ];

        const changes = [];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                let oldValue = transaction[field];
                let newValue = req.body[field];

                if (field === "amount") {
                    newValue = Number(newValue);

                    if (!Number.isFinite(newValue) || newValue <= 0) {
                        return res.status(400).json({
                            message: "Amount must be greater than 0"
                        });
                    }

                    oldValue = Number(oldValue);
                }

                if (field === "type") {
                    if (!["income", "expense"].includes(newValue)) {
                        return res.status(400).json({
                            message: "Invalid transaction type"
                        });
                    }
                }

                if (field === "date") {
                    const parsedDate = new Date(newValue);

                    if (Number.isNaN(parsedDate.getTime())) {
                        return res.status(400).json({
                            message: "Invalid transaction date"
                        });
                    }

                    newValue = parsedDate;
                    oldValue = new Date(oldValue);
                }

                const oldComparable =
                    oldValue instanceof Date
                        ? oldValue.toISOString()
                        : String(oldValue ?? "");

                const newComparable =
                    newValue instanceof Date
                        ? newValue.toISOString()
                        : String(newValue ?? "");

                if (oldComparable !== newComparable) {
                    changes.push({
                        field,
                        oldValue,
                        newValue
                    });
                }
            }
        }

        if (changes.length === 0) {
            return res.status(400).json({
                message: "No changes detected"
            });
        }

        for (const change of changes) {
            transaction[change.field] = change.newValue;
        }

        await transaction.save();

        const previousRevision = await Revision.findOne({
            userId: req.user.id,
            recordType: "Transaction",
            recordId: transaction._id
        }).sort({ version: -1 });

        const version = previousRevision
            ? previousRevision.version + 1
            : 1;

        const revision = await Revision.create({
            userId: req.user.id,
            recordType: "Transaction",
            recordId: transaction._id,
            version,
            changes
        });

        await AuditLog.create({
            userId: req.user.id,
            action: `Edited transaction ${transaction.category}`,
            status: "success"
        });

        await Notification.create({
            userId: req.user.id,
            message: `Transaction "${transaction.category}" was updated. Revision ${version} was recorded.`,
            status: "unread"
        });

        res.json({
            message: "Transaction updated successfully",
            transaction,
            revision
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to update transaction"
        });
    }
});

module.exports = router;