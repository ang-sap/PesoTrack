const express = require("express");
const Revision = require("../models/Revision");
const Transaction = require("../models/Transaction");
const Bill = require("../models/Bill");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/:recordType/:recordId", authMiddleware, async (req, res) => {
    try {
        const { recordType, recordId } = req.params;

        if (!["Transaction", "Bill"].includes(recordType)) {
            return res.status(400).json({
                message: "Invalid record type"
            });
        }

        let record;

        if (recordType === "Transaction") {
            record = await Transaction.findOne({
                _id: recordId,
                userId: req.user.id
            });
        } else {
            record = await Bill.findOne({
                _id: recordId,
                userId: req.user.id
            });
        }

        if (!record) {
            return res.status(404).json({
                message: "Record not found"
            });
        }

        const revisions = await Revision.find({
            userId: req.user.id,
            recordType,
            recordId
        }).sort({ version: -1, createdAt: -1 });

        res.json(revisions);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch revision history"
        });
    }
});

module.exports = router;
