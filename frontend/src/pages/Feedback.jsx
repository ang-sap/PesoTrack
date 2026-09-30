import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

function Feedback() {
    const [feedback, setFeedback] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        type: "Suggestion",
        subject: "",
        message: ""
    });

    const token = localStorage.getItem("token");

    const fetchFeedback = async () => {
        try {
            const response = await axios.get(
                "http://localhost:5000/api/feedback/mine",
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
        }
    };

    useEffect(() => {
        fetchFeedback();
    }, []);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        try {
            await axios.post(
                "http://localhost:5000/api/feedback",
                form,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMessage("Feedback submitted successfully.");

            setForm({
                type: "Suggestion",
                subject: "",
                message: ""
            });

            await fetchFeedback();

            setTimeout(() => {
                setModalOpen(false);
                setMessage("");
            }, 800);

        } catch (error) {
            console.error(error);

            setError(
                error.response?.data?.message ||
                "Failed to submit feedback."
            );
        }
    };

    return (
        <div className="app">

            <Sidebar />

            <main className="main-content">

                <div className="page-content">

                    <div className="feedback-header">

                        <div>
                            <p className="eyebrow purple">
                                HELP US IMPROVE
                            </p>

                            <h1>
                                Feedback & Suggestions
                            </h1>

                            <p className="subtitle">
                                Have an idea or found something that needs fixing?
                                Let us know.
                            </p>
                        </div>

                        <button
                            className="primary-button"
                            onClick={() => {
                                setModalOpen(true);
                                setMessage("");
                                setError("");
                            }}
                        >
                            <Icon icon="mdi:message-plus-outline" />
                            Send Feedback
                        </button>

                    </div>

                    <div className="feedback-info-grid">

                        <div className="feedback-info-card">
                            <div className="feedback-info-icon">
                                <Icon icon="mdi:lightbulb-outline" />
                            </div>

                            <div>
                                <strong>Have an idea?</strong>
                                <p>
                                    Suggest a feature or improvement.
                                </p>
                            </div>
                        </div>

                        <div className="feedback-info-card">
                            <div className="feedback-info-icon">
                                <Icon icon="mdi:bug-outline" />
                            </div>

                            <div>
                                <strong>Found a problem?</strong>
                                <p>
                                    Report something that isn't working correctly.
                                </p>
                            </div>
                        </div>

                        <div className="feedback-info-card">
                            <div className="feedback-info-icon">
                                <Icon icon="mdi:message-text-outline" />
                            </div>

                            <div>
                                <strong>General feedback</strong>
                                <p>
                                    Tell us about your experience using PesoTrack.
                                </p>
                            </div>
                        </div>

                    </div>

                    <section className="panel feedback-panel">

                        <div className="panel-header">

                            <div>
                                <h2>Your Feedback</h2>
                                <p>Track feedback you've submitted.</p>
                            </div>

                            <span className="feedback-count">
                                {feedback.length} submission
                                {feedback.length !== 1 ? "s" : ""}
                            </span>

                        </div>

                        {feedback.length === 0 ? (

                            <div className="feedback-empty">

                                <div className="feedback-empty-icon">
                                    <Icon icon="mdi:message-outline" />
                                </div>

                                <h3>No feedback yet</h3>

                                <p>
                                    Your submitted feedback will appear here.
                                </p>

                                <button
                                    className="secondary-button"
                                    onClick={() => setModalOpen(true)}
                                >
                                    Send your first feedback
                                </button>

                            </div>

                        ) : (

                            <div className="feedback-list">

                                {feedback.map((item) => (

                                    <div
                                        className="feedback-item"
                                        key={item._id}
                                    >

                                        <div className="feedback-item-icon">

                                            <Icon
                                                icon={
                                                    item.type === "Bug Report"
                                                        ? "mdi:bug-outline"
                                                        : item.type === "Suggestion"
                                                            ? "mdi:lightbulb-outline"
                                                            : "mdi:message-text-outline"
                                                }
                                            />

                                        </div>

                                        <div className="feedback-item-content">

                                            <div className="feedback-item-top">

                                                <div>
                                                    <span className="feedback-type">
                                                        {item.type}
                                                    </span>

                                                    <h3>
                                                        {item.subject}
                                                    </h3>
                                                </div>

                                                <span
                                                    className={`feedback-status ${item.status.toLowerCase()}`}
                                                >
                                                    {item.status}
                                                </span>

                                            </div>

                                            <p>
                                                {item.message}
                                            </p>

                                            <span className="feedback-date">
                                                Submitted{" "}
                                                {new Date(
                                                    item.createdAt
                                                ).toLocaleDateString()}
                                            </span>

                                        </div>

                                    </div>

                                ))}

                            </div>

                        )}

                    </section>

                </div>

            </main>

            {modalOpen && (

                <div
                    className="modal-overlay"
                    onClick={() => setModalOpen(false)}
                >

                    <div
                        className="modal-card"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <div className="modal-header">

                            <div>
                                <h2>Send Feedback</h2>
                                <p>
                                    Tell us what you think about PesoTrack.
                                </p>
                            </div>

                            <button
                                className="modal-close"
                                onClick={() => setModalOpen(false)}
                            >
                                <Icon icon="mdi:close" />
                            </button>

                        </div>

                        <form onSubmit={handleSubmit}>

                            <div className="form-group">

                                <label>Feedback Type</label>

                                <select
                                    name="type"
                                    value={form.type}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="Suggestion">
                                        Suggestion
                                    </option>

                                    <option value="Bug Report">
                                        Bug Report
                                    </option>

                                    <option value="General Feedback">
                                        General Feedback
                                    </option>
                                </select>

                            </div>

                            <div className="form-group">

                                <label>Subject</label>

                                <input
                                    type="text"
                                    name="subject"
                                    value={form.subject}
                                    onChange={handleChange}
                                    placeholder="What is your feedback about?"
                                    required
                                />

                            </div>

                            <div className="form-group">

                                <label>Message</label>

                                <textarea
                                    name="message"
                                    value={form.message}
                                    onChange={handleChange}
                                    placeholder="Tell us more..."
                                    rows="5"
                                    required
                                />

                            </div>

                            {message && (
                                <div className="savings-message success">
                                    {message}
                                </div>
                            )}

                            {error && (
                                <div className="savings-message error">
                                    {error}
                                </div>
                            )}

                            <div className="modal-actions">

                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() => setModalOpen(false)}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="primary-button"
                                >
                                    <Icon icon="mdi:send-outline" />
                                    Submit Feedback
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}

export default Feedback;