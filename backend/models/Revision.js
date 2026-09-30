const mongoose = require("mongoose");

const revisionChangeSchema = new mongoose.Schema(
    {
        field: {
            type: String,
            required: true
        },
        oldValue: {
            type: mongoose.Schema.Types.Mixed
        },
        newValue: {
            type: mongoose.Schema.Types.Mixed
        }
    },
    {
        _id: false
    }
);

const revisionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        recordType: {
            type: String,
            enum: ["Transaction", "Bill"],
            required: true
        },
        recordId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        version: {
            type: Number,
            required: true,
            min: 1
        },
        changes: {
            type: [revisionChangeSchema],
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Revision", revisionSchema);
