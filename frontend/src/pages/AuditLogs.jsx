import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import axios from "axios";

function AuditLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");

    const fetchLogs = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                "http://localhost:5000/api/admin/audit-logs",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setLogs(response.data);
        } catch (error) {
            console.error(error);

            setError(
                error.response?.data?.message ||
                "Failed to load audit logs."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <div className="admin-feedback-page">

            <div className="feedback-header">

                <div>
                    <p className="eyebrow purple">
                        SYSTEM MONITORING
                    </p>

                    <h1>
                        Audit Logs
                    </h1>

                    <p className="subtitle">
                        Track important activities performed in the system.
                    </p>
                </div>

            </div>

            {error && (
                <div className="savings-message error">
                    {error}
                </div>
            )}

            <section className="panel feedback-panel">

                <div className="panel-header">

                    <div>
                        <h2>
                            Activity Logs
                        </h2>

                        <p>
                            Review important system activities and actions.
                        </p>
                    </div>

                    <span className="feedback-count">
                        {logs.length} recorded activit
                        {logs.length === 1 ? "y" : "ies"}
                    </span>

                </div>

                {loading ? (

                    <div className="feedback-empty">

                        <div className="feedback-empty-icon">
                            <Icon
                                className="loading-icon"
                                icon="mdi:loading"
                            />
                        </div>

                        <h3>
                            Loading audit logs...
                        </h3>

                    </div>

                ) : logs.length === 0 ? (

                    <div className="feedback-empty">

                        <div className="feedback-empty-icon">
                            <Icon icon="mdi:clipboard-text-outline" />
                        </div>

                        <h3>
                            No audit logs yet
                        </h3>

                        <p>
                            Important system activities will appear here.
                        </p>

                    </div>

                ) : (

                    <div className="feedback-list">

                        {logs.map((log) => {

                            const userName =
                                log.userId?.name ||
                                "Unknown User";

                            const isSuccess =
                                log.status === "success";

                            return (
                                <div
                                    className="feedback-item"
                                    key={log._id}
                                >

                                    <div className="feedback-item-icon">
                                        <Icon
                                            icon={
                                                isSuccess
                                                    ? "mdi:shield-check-outline"
                                                    : "mdi:alert-circle-outline"
                                            }
                                        />
                                    </div>

                                    <div className="feedback-item-content">

                                        <div className="feedback-item-top">

                                            <div>
                                                <span className="feedback-type">
                                                    {userName}
                                                </span>

                                                <h3>
                                                    {log.action}
                                                </h3>
                                            </div>

                                            <span
                                                className={`feedback-status ${
                                                    isSuccess
                                                        ? "success"
                                                        : "failed"
                                                }`}
                                            >
                                                {log.status}
                                            </span>

                                        </div>

                                        <p className="admin-action-text">
                                            System activity recorded from{" "}
                                            {userName}.
                                        </p>

                                        <span className="feedback-date">
                                            {new Date(
                                                log.timestamp
                                            ).toLocaleString()}
                                        </span>

                                    </div>

                                </div>
                            );
                        })}

                    </div>

                )}

            </section>

        </div>
    );
}

export default AuditLogs;