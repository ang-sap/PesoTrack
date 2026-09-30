const express = require("express");
const Transaction = require("../models/Transaction");
const Bill = require("../models/Bill");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, async (req, res) => {
    try {
        const userId = req.user.id;

        const transactions = await Transaction.find({
            userId
        }).sort({ date: -1 });

        const bills = await Bill.find({
            userId
        });

        const totalIncome = transactions
            .filter(transaction => transaction.type === "income")
            .reduce((total, transaction) => total + transaction.amount, 0);

        const totalExpenses = transactions
            .filter(transaction => transaction.type === "expense")
            .reduce((total, transaction) => total + transaction.amount, 0);

        const balance = totalIncome - totalExpenses;

        const totalBills = bills.length;

        const paidBills = bills.filter(
            bill => bill.status === "paid"
        ).length;

        const unpaidBills = bills.filter(
            bill => bill.status === "unpaid"
        ).length;

        const recentTransactions = transactions.slice(0, 5);

        res.json({
            totalIncome,
            totalExpenses,
            balance,
            totalBills,
            paidBills,
            unpaidBills,
            recentTransactions
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to retrieve dashboard data"
        });
    }
});

module.exports = router;