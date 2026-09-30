const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const Payment = require("../models/Payment");
const Bill = require("../models/Bill");
const Transaction = require("../models/Transaction");
const AuditLog = require("../models/AuditLog");
const Notification = require("../models/Notification");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const uploadDirectory = path.join(__dirname, "..", "uploads", "payment-proofs");

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, {
        recursive: true
    });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const safeBaseName = path
            .basename(file.originalname, extension)
            .replace(/[^a-zA-Z0-9-_]/g, "-")
            .slice(0, 50);

        cb(
            null,
            `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeBaseName || "proof"}${extension}`
        );
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/pdf"
        ];

        if (!allowedTypes.includes(file.mimetype)) {
            return cb(
                new Error(
                    "Only JPG, PNG, WEBP, and PDF files are allowed."
                )
            );
        }

        cb(null, true);
    }
});

router.post(
    "/",
    authMiddleware,
    upload.single("proof"),
    async (req, res) => {
        try {
            const { billId, amount, method } = req.body;

            if (!billId || !amount || !method) {
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }

                return res.status(400).json({
                    message: "Bill, amount, and payment method are required."
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    message: "Proof of payment is required."
                });
            }

            const paymentAmount = Number(amount);

            if (Number.isNaN(paymentAmount) || paymentAmount <= 0) {
                fs.unlinkSync(req.file.path);

                return res.status(400).json({
                    message: "Payment amount must be greater than zero."
                });
            }

            const bill = await Bill.findOne({
                _id: billId,
                userId: req.user.id
            });

            if (!bill) {
                fs.unlinkSync(req.file.path);

                return res.status(404).json({
                    message: "Bill not found."
                });
            }

            if (bill.status === "paid") {
                fs.unlinkSync(req.file.path);

                return res.status(400).json({
                    message: "This bill is already paid."
                });
            }

            if (paymentAmount !== Number(bill.amount)) {
                fs.unlinkSync(req.file.path);

                return res.status(400).json({
                    message: "Payment amount must match the bill amount."
                });
            }

            const existingPayment = await Payment.findOne({
                billId: bill._id,
                userId: req.user.id
            });

            if (existingPayment) {
                fs.unlinkSync(req.file.path);

                return res.status(400).json({
                    message: "A payment already exists for this bill."
                });
            }

            const payment = await Payment.create({
                userId: req.user.id,
                billId: bill._id,
                amount: paymentAmount,
                method,
                paymentDate: new Date(),
                status: "confirmed",
                proofOfPayment: {
                    originalName: req.file.originalname,
                    fileName: req.file.filename,
                    url: `/uploads/payment-proofs/${req.file.filename}`,
                    mimeType: req.file.mimetype,
                    size: req.file.size
                }
            });

            bill.status = "paid";
            await bill.save();

            await Transaction.create({
                userId: req.user.id,
                type: "expense",
                category: "Bills",
                amount: paymentAmount,
                description: `Payment for ${bill.title}`,
                date: new Date()
            });

            await AuditLog.create({
                userId: req.user.id,
                action: `Recorded payment for bill: ${bill.title}`,
                status: "success"
            });

            await Notification.create({
                userId: req.user.id,
                message: `Payment confirmed for ${bill.title}. The bill is now marked as paid.`,
                status: "unread"
            });

            return res.status(201).json({
                message: "Payment confirmed and bill marked as paid.",
                payment,
                billStatus: bill.status
            });
        } catch (error) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            if (
                error instanceof multer.MulterError &&
                error.code === "LIMIT_FILE_SIZE"
            ) {
                return res.status(400).json({
                    message: "Proof of payment must be 5 MB or smaller."
                });
            }

            return res.status(500).json({
                message:
                    error.message ||
                    "Failed to confirm payment."
            });
        }
    }
);

router.get("/", authMiddleware, async (req, res) => {
    try {
        const payments = await Payment.find({
            userId: req.user.id
        })
            .populate("billId", "title amount dueDate status")
            .sort({ paymentDate: -1 });

        return res.json(payments);
    } catch (error) {
        return res.status(500).json({
            message: "Failed to load payments."
        });
    }
});

module.exports = router;