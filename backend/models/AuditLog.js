const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    action: {
        type: String,
        required: true
    },

    status: {
        type: String,
        enum: ["success", "failed"],
        default: "success"
    },

    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("AuditLog", auditLogSchema);