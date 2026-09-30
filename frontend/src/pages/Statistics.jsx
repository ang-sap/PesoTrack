import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";


function Statistics() {
    const [transactions, setTransactions] = useState([]);
    const [dashboard, setDashboard] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                const token = localStorage.getItem("token");
                const headers = { Authorization: `Bearer ${token}` };
                const [tx, dash] = await Promise.all([
                    axios.get("http://localhost:5000/api/transactions", { headers }),
                    axios.get("http://localhost:5000/api/dashboard", { headers })
                ]);
                setTransactions(tx.data);
                setDashboard(dash.data);
            } catch {
                setError("Failed to load statistics.");
            }
        };
        load();
    }, []);

    const monthly = useMemo(() => {
        const map = {};
        transactions.forEach((t) => {
            const month = new Date(t.date).toLocaleString("en-US", { month: "short" });
            if (!map[month]) map[month] = { month, income: 0, expense: 0 };
            map[month][t.type] += t.amount;
        });
        return Object.values(map).slice(-8);
    }, [transactions]);

    const categories = useMemo(() => {
        const map = {};
        transactions.filter((t) => t.type === "expense").forEach((t) => {
            map[t.category] = (map[t.category] || 0) + t.amount;
        });
        return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
    }, [transactions]);

    const colors = ["#8b5cf6", "#60a5fa", "#35d39a", "#f6b84b", "#fb7185", "#a78bfa"];

    return (
        <div className="app">
            <Sidebar />
            <main className="main-content">
                <Topbar />
                <div className="page-content inner-page">
                    <div className="welcome">
                        <div>
                            <p className="eyebrow purple">FINANCIAL INSIGHTS</p>
                            <h1>Statistics</h1>
                            <p className="subtitle">See where your money is coming from and where it goes.</p>
                        </div>
                    </div>

                    {error && <div className="error-banner">{error}</div>}

                    <div className="mini-stats">
                        <div className="mini-stat"><Icon icon="mdi:cash-plus" /><div><span>Total income</span><strong>₱{(dashboard?.totalIncome || 0).toLocaleString()}</strong></div></div>
                        <div className="mini-stat red"><Icon icon="mdi:cash-minus" /><div><span>Total expenses</span><strong>₱{(dashboard?.totalExpenses || 0).toLocaleString()}</strong></div></div>
                        <div className="mini-stat"><Icon icon="mdi:swap-horizontal" /><div><span>Transactions</span><strong>{transactions.length}</strong></div></div>
                    </div>

                    <div className="charts-grid modern-charts">
                        <section className="panel chart-card">
                            <div className="panel-header"><div><h2>Income vs expenses</h2><p>Monthly financial activity</p></div></div>
                            <div className="large-chart">
                                {monthly.length === 0 ? <div className="empty-state">No transaction data yet.</div> : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={monthly}>
                                            <CartesianGrid stroke="#292635" vertical={false} />
                                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#878393", fontSize: 11 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#878393", fontSize: 11 }} />
                                            <Tooltip contentStyle={{ background: "#171622", border: "1px solid #342f45", borderRadius: 10, color: "#fff" }} />
                                            <Bar dataKey="income" fill="#8b5cf6" radius={[5, 5, 0, 0]} />
                                            <Bar dataKey="expense" fill="#fb7185" radius={[5, 5, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </section>

                        <section className="panel chart-card">
                            <div className="panel-header"><div><h2>Spending by category</h2><p>Top expense categories</p></div></div>
                            <div className="large-chart pie-chart">
                                {categories.length === 0 ? <div className="empty-state">No expense data yet.</div> : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={categories} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={58}>
                                                {categories.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
                                            </Pie>
                                            <Tooltip contentStyle={{ background: "#171622", border: "1px solid #342f45", borderRadius: 10, color: "#fff" }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                            <div className="category-legend">
                                {categories.map((item, index) => (
                                    <div key={item.name}><span><i style={{ background: colors[index % colors.length] }} />{item.name}</span><strong>₱{item.value.toLocaleString()}</strong></div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Statistics;
