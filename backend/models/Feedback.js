const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        type: {
            type: String,
            enum: [
                "Suggestion",
                "Bug Report",
                "General Feedback"
            ],
            required: true
        },

        subject: {
            type: String,
            required: true,
            trim: true
        },

        message: {
            type: String,
            required: true,
            trim: true
        },

        status: {
            type: String,
            enum: [
                "New",
                "Reviewed",
                "Resolved"
            ],
            default: "New"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Feedback", feedbackSchema);