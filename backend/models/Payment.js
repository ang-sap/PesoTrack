const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        billId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Bill",
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0.01
        },
        method: {
            type: String,
            enum: ["Cash", "GCash", "Maya", "Bank Transfer"],
            required: true
        },
        paymentDate: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ["confirmed"],
            default: "confirmed"
        },
        proofOfPayment: {
            originalName: {
                type: String,
                required: true
            },
            fileName: {
                type: String,
                required: true
            },
            url: {
                type: String,
                required: true
            },
            mimeType: {
                type: String,
                required: true
            },
            size: {
                type: Number,
                required: true
            }
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Payment", paymentSchema);