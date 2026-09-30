import { Icon } from "@iconify/react";

function StatCard({ title, value, type }) {
    const icons = {
        balance: "mdi:wallet-outline",
        income: "mdi:arrow-top-right",
        expense: "mdi:arrow-bottom-left",
        bills: "mdi:receipt-alert-outline"
    };

    return (
        <div className="stat-card">
            <div className={`stat-icon ${type}`}>
                <Icon icon={icons[type]} />
            </div>
            <div>
                <p className="eyebrow">{title}</p>
                <p className="stat-value">{value}</p>
                <p className="stat-detail">
                    {type === "balance" ? "Available balance" :
                     type === "income" ? "Money received" :
                     type === "expense" ? "Money spent" :
                     "Awaiting payment"}
                </p>
            </div>
            <Icon className="stat-arrow" icon="mdi:arrow-top-right" />
        </div>
    );
}

export default StatCard;
