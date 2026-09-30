const express = require("express");
const Bill = require("../models/Bill");
const Revision = require("../models/Revision");
const AuditLog = require("../models/AuditLog");
const Notification = require("../models/Notification");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
    try {
        const {
            title,
            amount,
            dueDate
        } = req.body;

        if (!title || amount === undefined || amount === null || !dueDate) {
            return res.status(400).json({
                message: "Please complete all bill fields"
            });
        }

        if (Number(amount) <= 0) {
            return res.status(400).json({
                message: "Amount must be greater than 0"
            });
        }

        const bill = await Bill.create({
            userId: req.user.id,
            title,
            amount: Number(amount),
            dueDate,
            status: "unpaid"
        });

        res.status(201).json(bill);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to create bill"
        });
    }
});


router.get("/", authMiddleware, async (req, res) => {
    try {
        const bills = await Bill.find({
            userId: req.user.id
        }).sort({ dueDate: 1, createdAt: -1 });

        res.json(bills);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch bills"
        });
    }
});


router.patch("/:id", authMiddleware, async (req, res) => {
    try {
        const bill = await Bill.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!bill) {
            return res.status(404).json({
                message: "Bill not found"
            });
        }

        if (bill.status === "paid") {
            return res.status(400).json({
                message: "Paid bills cannot be edited"
            });
        }

        const allowedFields = [
            "title",
            "amount",
            "dueDate"
        ];

        const changes = [];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                let oldValue = bill[field];
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

                if (field === "dueDate") {
                    const parsedDate = new Date(newValue);

                    if (Number.isNaN(parsedDate.getTime())) {
                        return res.status(400).json({
                            message: "Invalid due date"
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
            bill[change.field] = change.newValue;
        }

        await bill.save();

        const previousRevision = await Revision.findOne({
            userId: req.user.id,
            recordType: "Bill",
            recordId: bill._id
        }).sort({ version: -1 });

        const version = previousRevision
            ? previousRevision.version + 1
            : 1;

        const revision = await Revision.create({
            userId: req.user.id,
            recordType: "Bill",
            recordId: bill._id,
            version,
            changes
        });

        await AuditLog.create({
            userId: req.user.id,
            action: `Edited bill ${bill.title}`,
            status: "success"
        });

        await Notification.create({
            userId: req.user.id,
            message: `Bill "${bill.title}" was updated. Revision ${version} was recorded.`,
            status: "unread"
        });

        res.json({
            message: "Bill updated successfully",
            bill,
            revision
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to update bill"
        });
    }
});

module.exports = router;