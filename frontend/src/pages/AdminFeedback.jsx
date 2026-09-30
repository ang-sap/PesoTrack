import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import axios from "axios";

function AdminFeedback() {
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingId, setUpdatingId] = useState("");

    const token = localStorage.getItem("token");

    const fetchFeedback = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                "http://localhost:5000/api/feedback/admin",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setFeedback(response.data);
        } catch (error) {
            console.error(error);
            setError(
                error.response?.data?.message ||
                "Failed to load feedback."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedback();
    }, []);

    const handleStatusChange = async (id, status) => {
        try {
            setUpdatingId(id);
            setError("");

            await axios.patch(
                `http://localhost:5000/api/feedback/admin/${id}/status`,
                { status },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setFeedback((current) =>
                current.map((item) =>
                    item._id === id
                        ? { ...item, status }
                        : item
                )
            );
        } catch (error) {
            console.error(error);
            setError(
                error.response?.data?.message ||
                "Failed to update feedback status."
            );
        } finally {
            setUpdatingId("");
        }
    };

    const getTypeIcon = (type) => {
        if (type === "Bug Report") {
            return "mdi:bug-outline";
        }

        if (type === "Suggestion") {
            return "mdi:lightbulb-outline";
        }

        return "mdi:message-text-outline";
    };

    return (
        <div className="admin-feedback-page">

            <div className="feedback-header">

                <div>
                    <p className="eyebrow purple">
                        ADMIN FEEDBACK
                    </p>

                    <h1>
                        Feedback & Suggestions
                    </h1>

                    <p className="subtitle">
                        Review suggestions, bug reports, and general feedback submitted by users.
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
                        <h2>All Feedback</h2>
                        <p>
                            Review and manage submitted feedback.
                        </p>
                    </div>

                    <span className="feedback-count">
                        {feedback.length} submission
                        {feedback.length !== 1 ? "s" : ""}
                    </span>

                </div>

                {loading ? (

                    <div className="feedback-empty">
                        <div className="feedback-empty-icon">
                            <Icon icon="mdi:loading" />
                        </div>

                        <h3>
                            Loading feedback...
                        </h3>
                    </div>

                ) : feedback.length === 0 ? (

                    <div className="feedback-empty">

                        <div className="feedback-empty-icon">
                            <Icon icon="mdi:message-outline" />
                        </div>

                        <h3>
                            No feedback yet
                        </h3>

                        <p>
                            User feedback will appear here once submitted.
                        </p>

                    </div>

                ) : (

                    <div className="admin-feedback-list">

                        {feedback.map((item) => (

                            <article
                                className="admin-feedback-item"
                                key={item._id}
                            >

                                <div className="admin-feedback-top">

                                    <div className="admin-feedback-user">

                                        <div className="feedback-item-icon">
                                            <Icon
                                                icon={getTypeIcon(item.type)}
                                            />
                                        </div>

                                        <div>
                                            <strong>
                                                {item.userId?.name ||
                                                    "Unknown User"}
                                            </strong>

                                            <span>
                                                {item.userId?.email ||
                                                    "No email"}
                                            </span>
                                        </div>

                                    </div>

                                    <span
                                        className={`feedback-status ${item.status.toLowerCase()}`}
                                    >
                                        {item.status}
                                    </span>

                                </div>

                                <div className="admin-feedback-body">

                                    <div className="admin-feedback-meta">

                                        <span className="feedback-type">
                                            {item.type}
                                        </span>

                                        <span className="feedback-date">
                                            {new Date(
                                                item.createdAt
                                            ).toLocaleDateString()}
                                        </span>

                                    </div>

                                    <h3>
                                        {item.subject}
                                    </h3>

                                    <p>
                                        {item.message}
                                    </p>

                                </div>

                                <div className="admin-feedback-footer">

                                    <div className="admin-feedback-action">

                                        <label>
                                            Status
                                        </label>

                                        <select
                                            value={item.status}
                                            disabled={
                                                updatingId === item._id
                                            }
                                            onChange={(e) =>
                                                handleStatusChange(
                                                    item._id,
                                                    e.target.value
                                                )
                                            }
                                        >

                                            <option value="New">
                                                New
                                            </option>

                                            <option value="Reviewed">
                                                Reviewed
                                            </option>

                                            <option value="Resolved">
                                                Resolved
                                            </option>

                                        </select>

                                    </div>

                                    {updatingId === item._id && (
                                        <span className="admin-feedback-updating">
                                            Updating...
                                        </span>
                                    )}

                                </div>

                            </article>

                        ))}

                    </div>

                )}

            </section>

        </div>
    );
}

export default AdminFeedback;