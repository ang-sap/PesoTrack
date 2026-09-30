import { Icon } from "@iconify/react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

function Topbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [accountOpen, setAccountOpen] = useState(false);

    const user = JSON.parse(localStorage.getItem("user"));

    const pageNames = {
        "/": "Dashboard",
        "/transactions": "Transactions",
        "/bills": "Bills",
        "/payments": "Payments",
        "/savings-goals": "Savings Goals",
        "/notifications": "Notifications",
        "/feedback": "Feedback & Suggestions",
        "/admin/users": "User Management",
        "/admin/audit-logs": "Audit Logs",
        "/admin/feedback": "Feedback & Suggestions"
    };

    const currentPage =
        pageNames[location.pathname] || "Dashboard";

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setAccountOpen(false);

        navigate("/login");
    };

    return (
        <header className="topbar">

            <div className="breadcrumb">
                <span>Workspace</span>
                <Icon icon="mdi:chevron-right" />
                <strong>{currentPage}</strong>
            </div>

            <div className="topbar-right">

                <button
                    className="topbar-icon-button"
                    onClick={() => {
                        if (user?.role === "admin") {
                            navigate("/admin/feedback");
                        } else {
                            navigate("/notifications");
                        }
                    }}
                >
                    <Icon icon="mdi:bell-outline" />
                </button>

                <div className="account-wrapper">

                    <button
                        className="account-button"
                        onClick={() =>
                            setAccountOpen(!accountOpen)
                        }
                    >

                        <div className="account-avatar">
                            {user?.name?.charAt(0)?.toUpperCase() || "A"}
                        </div>

                        <div className="account-info">

                            <strong>
                                {user?.name || "Personal User"}
                            </strong>

                            <span>
                                {user?.role === "admin"
                                    ? "Administrator"
                                    : "Personal"}
                            </span>

                        </div>

                        <Icon icon="mdi:chevron-down" />

                    </button>

                    {accountOpen && (

                        <div className="account-dropdown">

                            <div className="dropdown-user">

                                <div className="account-avatar large">
                                    {user?.name?.charAt(0)?.toUpperCase() || "A"}
                                </div>

                                <div>
                                    <strong>
                                        {user?.name || "Personal User"}
                                    </strong>

                                    <span>
                                        {user?.email || ""}
                                    </span>
                                </div>

                            </div>

                            <div className="dropdown-divider"></div>

                            <button
                                className="dropdown-item logout"
                                onClick={handleLogout}
                            >
                                <Icon icon="mdi:logout" />
                                <span>Logout</span>
                            </button>

                        </div>

                    )}

                </div>

            </div>

        </header>
    );
}

export default Topbar;