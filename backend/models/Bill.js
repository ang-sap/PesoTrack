const mongoose = require("mongoose");

const billSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    title: {
        type: String,
        required: true
    },

    amount: {
        type: Number,
        required: true,
        min: 0
    },

    dueDate: {
        type: Date,
        required: true
    },

    status: {
        type: String,
        enum: ["unpaid", "paid"],
        default: "unpaid"
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Bill", billSchema);