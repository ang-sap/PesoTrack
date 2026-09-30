import { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import { createPortal } from "react-dom";


function SavingsGoals() {
    const [goals, setGoals] = useState([]);

    const [showGoalModal, setShowGoalModal] = useState(false);
    const [showSavingsModal, setShowSavingsModal] = useState(false);

    const [editingGoal, setEditingGoal] = useState(null);
    const [selectedGoal, setSelectedGoal] = useState(null);

    const [name, setName] = useState("");
    const [targetAmount, setTargetAmount] = useState("");
    const [targetDate, setTargetDate] = useState("");

    const [savingsAmount, setSavingsAmount] = useState("");

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");

    const headers = {
        Authorization: `Bearer ${token}`
    };

    const fetchGoals = async () => {
        try {
            setError("");

            const response = await axios.get(
                "http://localhost:5000/api/savings-goals",
                { headers }
            );

            setGoals(response.data);
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Failed to load savings goals."
            );
        }
    };

    useEffect(() => {
        fetchGoals();
    }, []);

    const resetGoalForm = () => {
        setName("");
        setTargetAmount("");
        setTargetDate("");
        setEditingGoal(null);
    };

    const openCreateModal = () => {
        resetGoalForm();
        setMessage("");
        setError("");
        setShowGoalModal(true);
    };

    const openEditModal = (goal) => {
        setEditingGoal(goal);

        setName(goal.name);
        setTargetAmount(goal.targetAmount);
        setTargetDate(
            new Date(goal.targetDate)
                .toISOString()
                .split("T")[0]
        );

        setMessage("");
        setError("");
        setShowGoalModal(true);
    };

    const closeGoalModal = () => {
        setShowGoalModal(false);
        resetGoalForm();
    };

    const handleGoalSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        try {
            const data = {
                name,
                targetAmount: Number(targetAmount),
                targetDate
            };

            if (editingGoal) {
                await axios.patch(
                    `http://localhost:5000/api/savings-goals/${editingGoal._id}`,
                    data,
                    { headers }
                );

                setMessage(
                    "Savings goal updated successfully."
                );
            } else {
                await axios.post(
                    "http://localhost:5000/api/savings-goals",
                    data,
                    { headers }
                );

                setMessage(
                    "Savings goal created successfully."
                );
            }

            closeGoalModal();
            await fetchGoals();

        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Failed to save savings goal."
            );
        }
    };

    const openSavingsModal = (goal) => {
        setSelectedGoal(goal);
        setSavingsAmount("");
        setMessage("");
        setError("");
        setShowSavingsModal(true);
    };

    const closeSavingsModal = () => {
        setShowSavingsModal(false);
        setSelectedGoal(null);
        setSavingsAmount("");
    };

    const handleAddSavings = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        try {
            await axios.patch(
                `http://localhost:5000/api/savings-goals/${selectedGoal._id}/add`,
                {
                    amount: Number(savingsAmount)
                },
                { headers }
            );

            setMessage(
                "Savings added successfully."
            );

            closeSavingsModal();
            await fetchGoals();

        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Failed to add savings."
            );
        }
    };

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this savings goal?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setMessage("");
            setError("");

            await axios.delete(
                `http://localhost:5000/api/savings-goals/${id}`,
                { headers }
            );

            setMessage(
                "Savings goal deleted successfully."
            );

            await fetchGoals();

        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Failed to delete savings goal."
            );
        }
    };

    const formatCurrency = (value) => {
        return `₱${Number(value).toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    const formatDate = (value) => {
        return new Date(value).toLocaleDateString(
            "en-PH",
            {
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        );
    };

    return (
        <div className="savings-page">

            <div className="savings-header">

                <div>
                    <p className="eyebrow purple">
                        FINANCIAL GOALS
                    </p>

                    <h1>
                        Savings Goals
                    </h1>

                    <p className="subtitle">
                        Track your savings and work toward your financial goals.
                    </p>
                </div>

                <button
                    className="primary-button"
                    onClick={openCreateModal}
                >
                    <Icon icon="mdi:plus" />
                    Create Goal
                </button>

            </div>


            {message && (
                <div className="savings-message success">
                    <Icon icon="mdi:check-circle-outline" />
                    <span>{message}</span>
                </div>
            )}


            {error && (
                <div className="savings-message error">
                    <Icon icon="mdi:alert-circle-outline" />
                    <span>{error}</span>
                </div>
            )}


            {goals.length === 0 ? (

                <div className="savings-empty">

                    <div className="savings-empty-icon">
                        <Icon icon="mdi:target" />
                    </div>

                    <h2>
                        No savings goals yet
                    </h2>

                    <p>
                        Create your first savings goal and start tracking your progress.
                    </p>

                    <button
                        className="primary-button"
                        onClick={openCreateModal}
                    >
                        <Icon icon="mdi:plus" />
                        Create Goal
                    </button>

                </div>

            ) : (

                <div className="savings-grid">

                    {goals.map((goal) => (

                        <div
                            className="savings-card"
                            key={goal._id}
                        >

                            <div className="savings-card-top">

                                <div className="savings-goal-icon">
                                    <Icon icon="mdi:target" />
                                </div>

                                <div className="savings-card-actions">

                                    <button
                                        onClick={() =>
                                            openEditModal(goal)
                                        }
                                        title="Edit goal"
                                    >
                                        <Icon icon="mdi:pencil-outline" />
                                    </button>

                                    <button
                                        onClick={() =>
                                            handleDelete(goal._id)
                                        }
                                        title="Delete goal"
                                    >
                                        <Icon icon="mdi:delete-outline" />
                                    </button>

                                </div>

                            </div>


                            <div className="savings-card-title-row">

                                <div>
                                    <h2>
                                        {goal.name}
                                    </h2>

                                    <span
                                        className={`savings-status ${goal.status}`}
                                    >
                                        {goal.status === "completed"
                                            ? "COMPLETED"
                                            : "ACTIVE"}
                                    </span>
                                </div>

                            </div>


                            <div className="savings-amounts">

                                <div>
                                    <span>
                                        Saved
                                    </span>

                                    <strong>
                                        {formatCurrency(
                                            goal.currentAmount
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Target
                                    </span>

                                    <strong>
                                        {formatCurrency(
                                            goal.targetAmount
                                        )}
                                    </strong>
                                </div>

                            </div>


                            <div className="savings-progress-header">

                                <span>
                                    Progress
                                </span>

                                <strong>
                                    {goal.progress}%
                                </strong>

                            </div>


                            <div className="savings-progress">

                                <div
                                    className="savings-progress-fill"
                                    style={{
                                        width: `${goal.progress}%`
                                    }}
                                />

                            </div>


                            <div className="savings-details">

                                <div>
                                    <span>
                                        Remaining
                                    </span>

                                    <strong>
                                        {formatCurrency(
                                            goal.remaining
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Target date
                                    </span>

                                    <strong>
                                        {formatDate(
                                            goal.targetDate
                                        )}
                                    </strong>
                                </div>

                            </div>


                            {goal.status === "active" && (
                                <button
                                    className="savings-add-button"
                                    onClick={() =>
                                        openSavingsModal(goal)
                                    }
                                >
                                    <Icon icon="mdi:plus-circle-outline" />
                                    Add Savings
                                </button>
                            )}

                            {goal.status === "completed" && (
                                <div className="savings-completed">
                                    <Icon icon="mdi:check-circle" />
                                    Goal completed
                                </div>
                            )}

                        </div>

                    ))}

                </div>

            )}


            {showGoalModal &&
                createPortal(
                    <div
                        className="modal-overlay savings-modal-overlay"
                        onClick={closeGoalModal}
                    >

                        <div
                            className="modal-card"
                            onClick={(e) =>
                                e.stopPropagation()
                            }
                        >

                        <div className="modal-header">

                            <div>
                                <h2>
                                    {editingGoal
                                        ? "Edit Savings Goal"
                                        : "Create Savings Goal"}
                                </h2>

                                <p>
                                    Set a target and track your savings progress.
                                </p>
                            </div>

                            <button
                                className="modal-close"
                                onClick={closeGoalModal}
                            >
                                <Icon icon="mdi:close" />
                            </button>

                        </div>


                        <form
                            onSubmit={handleGoalSubmit}
                        >

                            <div className="form-group">

                                <label>
                                    Goal Name
                                </label>

                                <input
                                    type="text"
                                    placeholder="e.g. New Laptop"
                                    value={name}
                                    onChange={(e) =>
                                        setName(e.target.value)
                                    }
                                    required
                                />

                            </div>


                            <div className="form-group">

                                <label>
                                    Target Amount
                                </label>

                                <input
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    placeholder="30000"
                                    value={targetAmount}
                                    onChange={(e) =>
                                        setTargetAmount(e.target.value)
                                    }
                                    required
                                />

                            </div>


                            <div className="form-group">

                                <label>
                                    Target Date
                                </label>

                                <input
                                    type="date"
                                    value={targetDate}
                                    onChange={(e) =>
                                        setTargetDate(e.target.value)
                                    }
                                    required
                                />

                            </div>


                            <div className="modal-actions">

                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={closeGoalModal}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="primary-button"
                                >
                                    <Icon icon="mdi:check" />

                                    {editingGoal
                                        ? "Save Changes"
                                        : "Create Goal"}
                                </button>

                            </div>

                        </form>

                        </div>
                    </div>,
                    document.body
                )
            }


            {showSavingsModal && selectedGoal &&
                createPortal(
                    <div
                        className="modal-overlay savings-modal-overlay"
                        onClick={closeSavingsModal}
                    >

                        <div
                            className="modal-card"
                            onClick={(e) =>
                                e.stopPropagation()
                            }
                        >

                        <div className="modal-header">

                            <div>
                                <h2>
                                    Add Savings
                                </h2>

                                <p>
                                    Add money toward your goal.
                                </p>
                            </div>

                            <button
                                className="modal-close"
                                onClick={closeSavingsModal}
                            >
                                <Icon icon="mdi:close" />
                            </button>

                        </div>


                        <div className="savings-modal-summary">

                            <strong>
                                {selectedGoal.name}
                            </strong>

                            <span>
                                {formatCurrency(
                                    selectedGoal.currentAmount
                                )} saved of{" "}
                                {formatCurrency(
                                    selectedGoal.targetAmount
                                )}
                            </span>

                        </div>


                        <form
                            onSubmit={handleAddSavings}
                        >

                            <div className="form-group">

                                <label>
                                    Amount to Add
                                </label>

                                <input
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    placeholder="5000"
                                    value={savingsAmount}
                                    onChange={(e) =>
                                        setSavingsAmount(e.target.value)
                                    }
                                    required
                                />

                            </div>


                            <div className="modal-actions">

                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={closeSavingsModal}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="primary-button"
                                >
                                    <Icon icon="mdi:plus" />
                                    Add Savings
                                </button>

                            </div>

                        </form>

                        </div>
                    </div>,
                    document.body
                )
            }

        </div>
    );
}

export default SavingsGoals;