import { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";


function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [error, setError] = useState("");

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("http://localhost:5000/api/notifications", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(response.data);
        } catch {
            setError("Failed to load notifications.");
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markRead = async (id) => {
        try {
            const token = localStorage.getItem("token");
            await axios.patch(
                `http://localhost:5000/api/notifications/${id}/read`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchNotifications();
        } catch {
            setError("Failed to update notification.");
        }
    };

    const unread = notifications.filter((item) => item.status === "unread").length;

    return (
        <div className="app">
            <Sidebar />
            <main className="main-content">
                <Topbar />
                <div className="page-content inner-page">
                    <div className="welcome">
                        <div>
                            <p className="eyebrow purple">SYSTEM UPDATES</p>
                            <h1>Notifications</h1>
                            <p className="subtitle">Important updates from your financial activity.</p>
                        </div>
                    </div>

                    <div className="notification-summary">
                        <div className="notification-summary-icon"><Icon icon="mdi:bell-outline" /></div>
                        <div><strong>{unread} unread notification{unread !== 1 ? "s" : ""}</strong><span>Payment and account activity will appear here.</span></div>
                    </div>

                    {error && <div className="error-banner">{error}</div>}

                    <section className="panel">
                        <div className="panel-header">
                            <div><h2>All notifications</h2><p>Your latest system messages.</p></div>
                            <span className="count-pill">{notifications.length}</span>
                        </div>

                        <div className="modern-list notification-list-modern">
                            {notifications.length === 0 ? (
                                <div className="empty-state"><Icon icon="mdi:bell-off-outline" /><strong>No notifications</strong><span>You're all caught up.</span></div>
                            ) : notifications.map((notification) => (
                                <div className={`notification-row-modern ${notification.status}`} key={notification._id}>
                                    <div className="finance-icon"><Icon icon="mdi:bell-outline" /></div>
                                    <div className="finance-main">
                                        <strong>{notification.message}</strong>
                                        <span>{new Date(notification.createdAt).toLocaleString()}</span>
                                    </div>
                                    <div>
                                        {notification.status === "unread" ? (
                                            <button className="secondary-button" onClick={() => markRead(notification._id)}>Mark read</button>
                                        ) : (
                                            <span className="read-label"><Icon icon="mdi:check" /> Read</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}

export default Notifications;
