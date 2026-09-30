import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Icon } from "@iconify/react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";

function Dashboard() {
    const [dashboard, setDashboard] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [bills, setBills] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {

        const fetchDashboard = async () => {

            try {

                const token = localStorage.getItem("token");

                const headers = {
                    Authorization: `Bearer ${token}`
                };

                const [
                    dashboardResponse,
                    transactionsResponse,
                    billsResponse
                ] = await Promise.all([

                    axios.get(
                        "http://localhost:5000/api/dashboard",
                        { headers }
                    ),

                    axios.get(
                        "http://localhost:5000/api/transactions",
                        { headers }
                    ),

                    axios.get(
                        "http://localhost:5000/api/bills",
                        { headers }
                    )

                ]);

                setDashboard(dashboardResponse.data);
                setTransactions(transactionsResponse.data);
                setBills(billsResponse.data);

            } catch (error) {

                console.error(error);
                setError("Failed to load dashboard data.");

            }

        };

        fetchDashboard();

    }, []);


    const recentTransactions = useMemo(
        () => transactions.slice(0, 5),
        [transactions]
    );

    const unpaidBills = useMemo(
        () => bills.filter((bill) => bill.status === "unpaid"),
        [bills]
    );

    const chartData = useMemo(() => {
        const groupedData = {};

        transactions.forEach((transaction) => {
            const date = new Date(transaction.date);
            const month = date.toLocaleString("en-US", { month: "short" });

            if (!groupedData[month]) {
                groupedData[month] = { month, income: 0, expenses: 0 };
            }

            if (transaction.type === "income") {
                groupedData[month].income += transaction.amount;
            } else {
                groupedData[month].expenses += transaction.amount;
            }
        });

        return Object.values(groupedData).slice(-8);
    }, [transactions]);


    if (error) {

        return (
            <div className="app">

                <Sidebar />

                <main className="main-content">

                    <Topbar />

                    <div className="page-content">

                        <div className="loading-page">
                            <p>{error}</p>
                        </div>

                    </div>

                </main>

            </div>
        );

    }


    if (!dashboard) {

        return (
            <div className="app">

                <Sidebar />

                <main className="main-content">

                    <Topbar />

                    <div className="page-content">

                        <div className="loading-page">
                            <p>Loading dashboard...</p>
                        </div>

                    </div>

                </main>

            </div>
        );

    }


    return (
        <div className="app">

            <Sidebar />

            <main className="main-content">

                <Topbar />

                <div className="page-content">

                    <div className="welcome">

                        <div>

                            <p className="eyebrow purple">
                                FINANCIAL OVERVIEW
                            </p>

                            <h1>
                                Financial Overview
                            </h1>

                            <p className="subtitle">
                                Keep track of your money and upcoming bills.
                            </p>

                        </div>


                        <Link
                            to="/transactions"
                            className="primary-button"
                        >
                            <Icon icon="mdi:plus" />
                            Add transaction
                        </Link>

                    </div>


                    <section className="stats-grid">

                        <StatCard
                            title="Total balance"
                            value={`₱ ${dashboard.balance.toLocaleString()}`}
                            type="balance"
                        />

                        <StatCard
                            title="Total income"
                            value={`₱ ${dashboard.totalIncome.toLocaleString()}`}
                            type="income"
                        />

                        <StatCard
                            title="Total expenses"
                            value={`₱ ${dashboard.totalExpenses.toLocaleString()}`}
                            type="expense"
                        />

                        <StatCard
                            title="Unpaid bills"
                            value={dashboard.unpaidBills}
                            type="bills"
                        />

                    </section>


                    <section className="dashboard-grid">

                        <div className="panel chart-panel">

                            <div className="panel-header">

                                <div>

                                    <h2>
                                        Income & expenses
                                    </h2>

                                    <p>
                                        Financial activity
                                    </p>

                                </div>

                            </div>


                            <div className="legend">

                                <span>
                                    <i className="legend-income" />
                                    Income
                                </span>

                                <span>
                                    <i className="legend-expense" />
                                    Expenses
                                </span>

                            </div>


                            <div className="chart-wrap">

                                {chartData.length === 0 ? (

                                    <div className="empty-state">
                                        No transaction data yet.
                                    </div>

                                ) : (

                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >

                                        <AreaChart
                                            data={chartData}
                                            margin={{
                                                top: 12,
                                                right: 10,
                                                left: -22,
                                                bottom: 0
                                            }}
                                        >

                                            <defs>

                                                <linearGradient
                                                    id="incomeFill"
                                                    x1="0"
                                                    y1="0"
                                                    x2="0"
                                                    y2="1"
                                                >

                                                    <stop
                                                        offset="0%"
                                                        stopColor="#7c4dff"
                                                        stopOpacity={0.25}
                                                    />

                                                    <stop
                                                        offset="100%"
                                                        stopColor="#7c4dff"
                                                        stopOpacity={0}
                                                    />

                                                </linearGradient>


                                                <linearGradient
                                                    id="expenseFill"
                                                    x1="0"
                                                    y1="0"
                                                    x2="0"
                                                    y2="1"
                                                >

                                                    <stop
                                                        offset="0%"
                                                        stopColor="#ed6b9b"
                                                        stopOpacity={0.15}
                                                    />

                                                    <stop
                                                        offset="100%"
                                                        stopColor="#ed6b9b"
                                                        stopOpacity={0}
                                                    />

                                                </linearGradient>

                                            </defs>


                                            <CartesianGrid
                                                stroke="#282635"
                                                vertical={false}
                                            />


                                            <XAxis
                                                dataKey="month"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{
                                                    fill: "#878393",
                                                    fontSize: 12
                                                }}
                                            />


                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{
                                                    fill: "#878393",
                                                    fontSize: 12
                                                }}
                                                tickFormatter={(value) =>
                                                    `₱${value / 1000}k`
                                                }
                                            />


                                            <Tooltip
                                                contentStyle={{
                                                    background: "#201e2c",
                                                    border: "1px solid #383446",
                                                    borderRadius: 10,
                                                    color: "#fff"
                                                }}
                                            />


                                            <Area
                                                type="monotone"
                                                dataKey="income"
                                                stroke="#8f6bff"
                                                fill="url(#incomeFill)"
                                                strokeWidth={2.5}
                                            />


                                            <Area
                                                type="monotone"
                                                dataKey="expenses"
                                                stroke="#e978a2"
                                                fill="url(#expenseFill)"
                                                strokeWidth={2.5}
                                            />

                                        </AreaChart>

                                    </ResponsiveContainer>

                                )}

                            </div>

                        </div>


                        <div className="panel bills-panel">

                            <div className="panel-header">

                                <div>

                                    <h2>
                                        Upcoming bills
                                    </h2>

                                    <p>
                                        Keep payments on schedule
                                    </p>

                                </div>


                                <Link
                                    to="/bills"
                                    className="text-button"
                                >
                                    View all
                                    <Icon icon="mdi:arrow-right" />
                                </Link>

                            </div>


                            <div className="bill-list">

                                {unpaidBills.length === 0 ? (

                                    <div className="empty-state">
                                        No unpaid bills.
                                    </div>

                                ) : (

                                    unpaidBills
                                        .slice(0, 4)
                                        .map((bill) => (

                                            <div
                                                className="bill-row"
                                                key={bill._id}
                                            >

                                                <div className="bill-icon">

                                                    <Icon
                                                        icon="mdi:receipt-text-outline"
                                                    />

                                                </div>


                                                <div className="bill-info">

                                                    <strong>
                                                        {bill.title}
                                                    </strong>

                                                    <span>
                                                        Due{" "}
                                                        {new Date(
                                                            bill.dueDate
                                                        ).toLocaleDateString()}
                                                    </span>

                                                </div>


                                                <div className="bill-total">

                                                    <strong>
                                                        ₱{" "}
                                                        {bill.amount.toLocaleString()}
                                                    </strong>

                                                    <span className="status unpaid">
                                                        UNPAID
                                                    </span>

                                                </div>

                                            </div>

                                        ))

                                )}

                            </div>

                        </div>

                    </section>


                    <section className="panel transactions-panel">

                        <div className="panel-header">

                            <div>

                                <h2>
                                    Recent transactions
                                </h2>

                                <p>
                                    Your latest income and expenses
                                </p>

                            </div>


                            <Link
                                to="/transactions"
                                className="text-button"
                            >
                                View all
                                <Icon icon="mdi:arrow-right" />
                            </Link>

                        </div>


                        <div className="transaction-head">

                            <span>TRANSACTION</span>
                            <span>DATE</span>
                            <span>AMOUNT</span>

                        </div>


                        {recentTransactions.length === 0 ? (

                            <div className="empty-state">
                                No transactions yet.
                            </div>

                        ) : (

                            recentTransactions.map((transaction) => (

                                <div
                                    className="transaction-row"
                                    key={transaction._id}
                                >

                                    <div className="transaction-main">

                                        <div
                                            className={`transaction-icon ${transaction.type}`}
                                        >

                                            <Icon
                                                icon={
                                                    transaction.type ===
                                                        "income"
                                                        ? "mdi:cash-plus"
                                                        : "mdi:receipt-text-outline"
                                                }
                                            />

                                        </div>


                                        <div>

                                            <strong>
                                                {transaction.category}
                                            </strong>

                                            <span>
                                                {transaction.description ||
                                                    "No description"}
                                            </span>

                                        </div>

                                    </div>


                                    <span className="date">

                                        {new Date(
                                            transaction.date
                                        ).toLocaleDateString()}

                                    </span>


                                    <strong
                                        className={`amount ${transaction.type}`}
                                    >

                                        {transaction.type === "income"
                                            ? "+"
                                            : "-"}

                                        ₱{" "}
                                        {transaction.amount.toLocaleString()}

                                    </strong>

                                </div>

                            ))

                        )}

                    </section>

                </div>

            </main>

        </div>
    );
}


export default Dashboard;