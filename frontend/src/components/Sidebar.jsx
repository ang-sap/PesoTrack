import { useState } from "react";
import { Icon } from "@iconify/react";
import { NavLink, useNavigate } from "react-router-dom";

function Sidebar() {
    const navigate = useNavigate();
    const [logoutOpen, setLogoutOpen] = useState(false);

    let user = null;

    try {
        user = JSON.parse(localStorage.getItem("user"));
    } catch {
        user = null;
    }

    const isAdmin = user?.role === "admin";

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setLogoutOpen(false);
        navigate("/login", { replace: true });
    };

    const handleFeedback = () => {
        if (isAdmin) {
            navigate("/admin/feedback");
        } else {
            navigate("/feedback");
        }
    };

    return (
        <>
            <aside className="sidebar">
                <div className="brand">
                    <div className="brand-icon">
                        <Icon icon="mdi:wallet-outline" />
                    </div>

                    <span className="brand-text">
                        Peso<span>Track</span>
                    </span>
                </div>

                <nav className="sidebar-nav">
                    {!isAdmin && (
                        <>
                            <div className="nav-section">
                                <div className="nav-label">
                                    OVERVIEW
                                </div>

                                <NavLink
                                    to="/"
                                    end
                                    className={({ isActive }) =>
                                        `nav-item ${isActive ? "active" : ""}`
                                    }
                                >
                                    <Icon icon="mdi:view-dashboard-outline" />
                                    <span>Dashboard</span>
                                </NavLink>

                                <NavLink
                                    to="/transactions"
                                    className={({ isActive }) =>
                                        `nav-item ${isActive ? "active" : ""}`
                                    }
                                >
                                    <Icon icon="mdi:swap-horizontal" />
                                    <span>Transactions</span>
                                </NavLink>

                                <NavLink
                                    to="/bills"
                                    className={({ isActive }) =>
                                        `nav-item ${isActive ? "active" : ""}`
                                    }
                                >
                                    <Icon icon="mdi:receipt-text-outline" />
                                    <span>Bills</span>
                                </NavLink>

                                <NavLink
                                    to="/payments"
                                    className={({ isActive }) =>
                                        `nav-item ${isActive ? "active" : ""}`
                                    }
                                >
                                    <Icon icon="mdi:credit-card-outline" />
                                    <span>Payments</span>
                                </NavLink>

                                <NavLink
                                    to="/savings-goals"
                                    className={({ isActive }) =>
                                        `nav-item ${isActive ? "active" : ""}`
                                    }
                                >
                                    <Icon icon="mdi:target" />
                                    <span>Savings Goals</span>
                                </NavLink>
                            </div>

                            <div className="nav-section">
                                <div className="nav-label">
                                    SYSTEM
                                </div>

                                <NavLink
                                    to="/notifications"
                                    className={({ isActive }) =>
                                        `nav-item ${isActive ? "active" : ""}`
                                    }
                                >
                                    <Icon icon="mdi:bell-outline" />
                                    <span>Notifications</span>
                                </NavLink>
                            </div>
                        </>
                    )}

                    {isAdmin && (
                        <div className="nav-section">
                            <div className="nav-label">
                                ADMIN
                            </div>

                            <NavLink
                                to="/admin/users"
                                className={({ isActive }) =>
                                    `nav-item ${isActive ? "active" : ""}`
                                }
                            >
                                <Icon icon="mdi:account-group-outline" />
                                <span>User Management</span>
                            </NavLink>

                            <NavLink
                                to="/admin/audit-logs"
                                className={({ isActive }) =>
                                    `nav-item ${isActive ? "active" : ""}`
                                }
                            >
                                <Icon icon="mdi:file-document-outline" />
                                <span>Audit Logs</span>
                            </NavLink>
                        </div>
                    )}
                </nav>

                <div className="sidebar-account">
                    <div className="sidebar-account-info">
                        <div className="sidebar-avatar">
                            {user?.name?.charAt(0)?.toUpperCase() || "A"}
                        </div>

                        <div className="sidebar-user-details">
                            <strong>
                                {user?.name || "Personal User"}
                            </strong>

                            <span>
                                {isAdmin ? "Administrator" : "Personal"}
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="sidebar-logout-button"
                        onClick={() => setLogoutOpen(true)}
                    >
                        <Icon icon="mdi:logout" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            <button
                className="floating-feedback"
                onClick={handleFeedback}
                title="Feedback & Suggestions"
            >
                <Icon icon="mdi:message-text-outline" />
                <span>Feedback</span>
            </button>

            {logoutOpen && (
                <div
                    className="modal-overlay logout-modal-overlay"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setLogoutOpen(false);
                        }
                    }}
                >
                    <div
                        className="modal-card logout-modal-card"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="logout-confirm-title"
                    >
                        <div className="modal-header">
                            <div>
                                <p className="modal-eyebrow">
                                    ACCOUNT
                                </p>

                                <h2 id="logout-confirm-title">
                                    Log out of PesoTrack?
                                </h2>

                                <p>
                                    You will need to sign in again to access your account.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="modal-close"
                                onClick={() => setLogoutOpen(false)}
                                aria-label="Close"
                            >
                                <Icon icon="mdi:close" />
                            </button>
                        </div>

                        <div className="logout-confirm-content">
                            <div className="logout-confirm-icon">
                                <Icon icon="mdi:logout" />
                            </div>

                            <div>
                                <strong>
                                    Confirm logout
                                </strong>

                                <span>
                                    Your current session will be ended.
                                </span>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={() => setLogoutOpen(false)}
                            >
                                Stay logged in
                            </button>

                            <button
                                type="button"
                                className="primary-button logout-confirm-button"
                                onClick={handleLogout}
                            >
                                <Icon icon="mdi:logout" />
                                Log out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Sidebar;