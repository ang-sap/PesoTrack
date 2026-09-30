import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const EMPTY_FORM = {
    title: "",
    amount: "",
    dueDate: ""
};

const BILL_FIELDS = [
    { key: "title", label: "Bill Name" },
    { key: "amount", label: "Amount" },
    { key: "dueDate", label: "Due Date" }
];

function formatDateInput(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toISOString().split("T")[0];
}

function formatDate(value) {
    if (!value) return "No date";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "No date";
    }

    return date.toLocaleDateString();
}

function formatCurrency(value) {
    const amount = Number(value || 0);

    return `₱${amount.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

function displayValue(field, value) {
    if (value === null || value === undefined || value === "") {
        return "None";
    }

    if (field === "amount") {
        return formatCurrency(value);
    }

    if (field === "dueDate") {
        return formatDate(value);
    }

    return String(value);
}

function getChanges(original, updated) {
    return BILL_FIELDS
        .filter(({ key }) => {
            if (key === "amount") {
                return Number(original[key]) !== Number(updated[key]);
            }

            if (key === "dueDate") {
                return (
                    formatDateInput(original[key]) !==
                    formatDateInput(updated[key])
                );
            }

            return String(original[key] ?? "") !== String(updated[key] ?? "");
        })
        .map(({ key, label }) => ({
            field: key,
            label,
            oldValue: original[key],
            newValue: updated[key]
        }));
}

function Bills() {
    const [bills, setBills] = useState([]);
    const [modalMode, setModalMode] = useState(null);
    const [activeBill, setActiveBill] = useState(null);
    const [originalForm, setOriginalForm] = useState(EMPTY_FORM);
    const [form, setForm] = useState(EMPTY_FORM);
    const [revisions, setRevisions] = useState([]);

    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [modalMessage, setModalMessage] = useState("");
    const [modalMessageType, setModalMessageType] = useState("");

    const changes = useMemo(
        () => getChanges(originalForm, form),
        [originalForm, form]
    );

    const fetchBills = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await axios.get(
                "http://localhost:5000/api/bills",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setBills(response.data);
        } catch {
            setMessage("Failed to load bills.");
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBills();
    }, []);

    const openAddModal = () => {
        setForm(EMPTY_FORM);
        setOriginalForm(EMPTY_FORM);
        setActiveBill(null);
        setModalMessage("");
        setModalMessageType("");
        setMessage("");
        setMessageType("");
        setModalMode("add");
    };

    const openEditModal = (bill) => {
        if (bill.status === "paid") {
            setMessage("Paid bills cannot be edited.");
            setMessageType("error");

            setTimeout(() => {
                setMessage("");
                setMessageType("");
            }, 2500);

            return;
        }

        const editForm = {
            title: bill.title || "",
            amount: String(bill.amount ?? ""),
            dueDate: formatDateInput(bill.dueDate)
        };

        setActiveBill(bill);
        setOriginalForm(editForm);
        setForm(editForm);
        setModalMessage("");
        setModalMessageType("");
        setMessage("");
        setMessageType("");
        setModalMode("edit");
    };

    const openHistoryModal = async (bill) => {
        setActiveBill(bill);
        setRevisions([]);
        setHistoryLoading(true);
        setModalMessage("");
        setModalMessageType("");
        setModalMode("history");

        try {
            const token = localStorage.getItem("token");

            const response = await axios.get(
                `http://localhost:5000/api/revisions/Bill/${bill._id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setRevisions(response.data);
        } catch (error) {
            setModalMessage(
                error.response?.data?.message ||
                "Failed to load revision history."
            );
            setModalMessageType("error");
        } finally {
            setHistoryLoading(false);
        }
    };

    const closeModal = () => {
        if (saving) return;

        setModalMode(null);
        setActiveBill(null);
        setOriginalForm(EMPTY_FORM);
        setForm(EMPTY_FORM);
        setRevisions([]);
        setModalMessage("");
        setModalMessageType("");
        setSaving(false);
    };

    const handleFormChange = (e) => {
        setForm((current) => ({
            ...current,
            [e.target.name]: e.target.value
        }));
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setModalMessage("");
            setModalMessageType("");

            const token = localStorage.getItem("token");

            await axios.post(
                "http://localhost:5000/api/bills",
                {
                    ...form,
                    amount: Number(form.amount)
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setModalMessage("Bill added successfully.");
            setModalMessageType("success");

            await fetchBills();

            setTimeout(() => {
                closeModal();
            }, 700);
        } catch (error) {
            setModalMessage(
                error.response?.data?.message ||
                "Failed to add bill."
            );
            setModalMessageType("error");
        } finally {
            setSaving(false);
        }
    };

    const openReview = () => {
        if (changes.length === 0) {
            setModalMessage("No changes detected.");
            setModalMessageType("error");
            return;
        }

        setModalMessage("");
        setModalMessageType("");
        setModalMode("review");
    };

    const handleConfirmChanges = async () => {
        if (!activeBill || changes.length === 0) {
            return;
        }

        try {
            setSaving(true);
            setModalMessage("");
            setModalMessageType("");

            const token = localStorage.getItem("token");

            const response = await axios.patch(
                `http://localhost:5000/api/bills/${activeBill._id}`,
                {
                    title: form.title,
                    amount: Number(form.amount),
                    dueDate: form.dueDate
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setBills((current) =>
                current.map((item) =>
                    item._id === activeBill._id
                        ? response.data.bill
                        : item
                )
            );

            setModalMessage("Changes confirmed successfully.");
            setModalMessageType("success");

            setTimeout(() => {
                closeModal();

                setMessage("Bill updated successfully.");
                setMessageType("success");

                setTimeout(() => {
                    setMessage("");
                    setMessageType("");
                }, 2500);
            }, 700);
        } catch (error) {
            setModalMessage(
                error.response?.data?.message ||
                "Failed to update bill."
            );
            setModalMessageType("error");
        } finally {
            setSaving(false);
        }
    };

    const unpaid = bills.filter(
        (bill) => bill.status === "unpaid"
    ).length;

    const paid = bills.filter(
        (bill) => bill.status === "paid"
    ).length;

    const renderFormFields = () => (
        <>
            <div className="form-group">
                <label>Bill Name</label>

                <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleFormChange}
                    placeholder="e.g. Internet Bill"
                    required
                />
            </div>

            <div className="form-group">
                <label>Amount</label>

                <input
                    type="number"
                    name="amount"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={handleFormChange}
                    placeholder="0.00"
                    required
                />
            </div>

            <div className="form-group">
                <label>Due Date</label>

                <input
                    type="date"
                    name="dueDate"
                    value={form.dueDate}
                    onChange={handleFormChange}
                    required
                />
            </div>
        </>
    );

    return (
        <div className="app">
            <Sidebar />

            <main className="main-content">
                <Topbar />

                <div className="page-content inner-page">
                    <div className="welcome">
                        <div>
                            <p className="eyebrow purple">
                                BILL MANAGEMENT
                            </p>

                            <h1>Bills</h1>

                            <p className="subtitle">
                                Keep your recurring and upcoming payments organized.
                            </p>
                        </div>

                        <button
                            className="primary-button"
                            onClick={openAddModal}
                        >
                            <Icon icon="mdi:plus" />
                            Add bill
                        </button>
                    </div>

                    <div className="mini-stats">
                        <div className="mini-stat">
                            <Icon icon="mdi:receipt-text-outline" />

                            <div>
                                <span>Total bills</span>
                                <strong>{bills.length}</strong>
                            </div>
                        </div>

                        <div className="mini-stat amber">
                            <Icon icon="mdi:clock-alert-outline" />

                            <div>
                                <span>Unpaid</span>
                                <strong>{unpaid}</strong>
                            </div>
                        </div>

                        <div className="mini-stat green">
                            <Icon icon="mdi:check-circle-outline" />

                            <div>
                                <span>Paid</span>
                                <strong>{paid}</strong>
                            </div>
                        </div>
                    </div>

                    {message && (
                        <div className={`savings-message ${messageType}`}>
                            <Icon
                                icon={
                                    messageType === "success"
                                        ? "mdi:check-circle-outline"
                                        : "mdi:alert-circle-outline"
                                }
                            />

                            <span>{message}</span>
                        </div>
                    )}

                    <section className="panel">
                        <div className="panel-header">
                            <div>
                                <h2>Bill history</h2>

                                <p>
                                    Edit unpaid bills, review changes, or view revision history.
                                </p>
                            </div>

                            <span className="count-pill">
                                {bills.length}
                            </span>
                        </div>

                        {loading ? (
                            <div className="empty-state">
                                Loading bills...
                            </div>
                        ) : bills.length === 0 ? (
                            <div className="empty-state">
                                <Icon icon="mdi:receipt-text-remove-outline" />

                                <strong>No bills yet</strong>

                                <span>
                                    Add a bill to start tracking payments.
                                </span>
                            </div>
                        ) : (
                            <div className="modern-list">
                                {bills.map((bill) => (
                                    <div
                                        className="finance-row revision-ready-row"
                                        key={bill._id}
                                    >
                                        <div className="finance-icon bill">
                                            <Icon
                                                icon={
                                                    bill.status === "paid"
                                                        ? "mdi:check"
                                                        : "mdi:receipt-text-outline"
                                                }
                                            />
                                        </div>

                                        <div className="finance-main">
                                            <strong>{bill.title}</strong>

                                            <span>
                                                Due {formatDate(bill.dueDate)}
                                            </span>
                                        </div>

                                        <div className="finance-meta">
                                            <strong>
                                                {formatCurrency(bill.amount)}
                                            </strong>

                                            <span
                                                className={`status ${bill.status}`}
                                            >
                                                {bill.status}
                                            </span>
                                        </div>

                                        <div className="transaction-actions">
                                            <button
                                                type="button"
                                                className="icon-action-button"
                                                onClick={() =>
                                                    openHistoryModal(bill)
                                                }
                                                title="View revision history"
                                                aria-label="View revision history"
                                            >
                                                <Icon icon="mdi:history" />
                                            </button>

                                            <button
                                                type="button"
                                                className="secondary-button compact-button"
                                                onClick={() =>
                                                    openEditModal(bill)
                                                }
                                                disabled={bill.status === "paid"}
                                                title={
                                                    bill.status === "paid"
                                                        ? "Paid bills cannot be edited"
                                                        : "Edit bill"
                                                }
                                            >
                                                <Icon icon="mdi:pencil-outline" />
                                                Edit
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>

            {modalMode === "add" && (
                <div
                    className="modal-overlay"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget && !saving) {
                            closeModal();
                        }
                    }}
                >
                    <div
                        className="modal-card revision-modal-card"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="bill-add-title"
                    >
                        <div className="modal-header">
                            <div>
                                <p className="modal-eyebrow">NEW RECORD</p>

                                <h2 id="bill-add-title">
                                    Create Bill
                                </h2>

                                <p>
                                    Add a bill and keep track of its due date.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="modal-close"
                                onClick={closeModal}
                                disabled={saving}
                                aria-label="Close"
                            >
                                <Icon icon="mdi:close" />
                            </button>
                        </div>

                        <form onSubmit={handleAddSubmit}>
                            {renderFormFields()}

                            {modalMessage && (
                                <div
                                    className={`savings-message ${modalMessageType}`}
                                >
                                    <Icon
                                        icon={
                                            modalMessageType === "success"
                                                ? "mdi:check-circle-outline"
                                                : "mdi:alert-circle-outline"
                                        }
                                    />

                                    <span>{modalMessage}</span>
                                </div>
                            )}

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="primary-button"
                                    disabled={saving}
                                >
                                    <Icon icon="mdi:check" />
                                    {saving ? "Saving..." : "Create Bill"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {modalMode === "edit" && (
                <div
                    className="modal-overlay"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget && !saving) {
                            closeModal();
                        }
                    }}
                >
                    <div
                        className="modal-card revision-modal-card"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="bill-edit-title"
                    >
                        <div className="modal-header">
                            <div>
                                <p className="modal-eyebrow">EDIT RECORD</p>

                                <h2 id="bill-edit-title">
                                    Edit Bill
                                </h2>

                                <p>
                                    Update the bill, then review the changes before saving.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="modal-close"
                                onClick={closeModal}
                                disabled={saving}
                                aria-label="Close"
                            >
                                <Icon icon="mdi:close" />
                            </button>
                        </div>

                        {renderFormFields()}

                        <div className="bill-edit-note">
                            <Icon icon="mdi:information-outline" />
                            <span>
                                Paid bills are locked and cannot be edited.
                            </span>
                        </div>

                        {modalMessage && (
                            <div
                                className={`savings-message ${modalMessageType}`}
                            >
                                <Icon
                                    icon={
                                        modalMessageType === "success"
                                            ? "mdi:check-circle-outline"
                                            : "mdi:alert-circle-outline"
                                    }
                                />

                                <span>{modalMessage}</span>
                            </div>
                        )}

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={closeModal}
                                disabled={saving}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="primary-button"
                                onClick={openReview}
                                disabled={saving}
                            >
                                <Icon icon="mdi:eye-outline" />
                                Review Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalMode === "review" && (
                <div
                    className="modal-overlay"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget && !saving) {
                            closeModal();
                        }
                    }}
                >
                    <div
                        className="modal-card revision-modal-card review-modal-card"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="bill-review-title"
                    >
                        <div className="modal-header">
                            <div>
                                <p className="modal-eyebrow">REVIEW BEFORE SAVE</p>

                                <h2 id="bill-review-title">
                                    Review Changes
                                </h2>

                                <p>
                                    Check the old and new bill details before confirming the update.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="modal-close"
                                onClick={closeModal}
                                disabled={saving}
                                aria-label="Close"
                            >
                                <Icon icon="mdi:close" />
                            </button>
                        </div>

                        <div className="review-summary-box">
                            <div className="review-summary-icon">
                                <Icon icon="mdi:file-edit-outline" />
                            </div>

                            <div>
                                <strong>{activeBill?.title}</strong>

                                <span>
                                    {changes.length} field
                                    {changes.length !== 1 ? "s" : ""} will be updated.
                                </span>
                            </div>
                        </div>

                        <div className="revision-change-list">
                            {changes.map((change) => (
                                <div
                                    className="revision-change-card"
                                    key={change.field}
                                >
                                    <div className="revision-change-label">
                                        {change.label}
                                    </div>

                                    <div className="revision-value-grid">
                                        <div>
                                            <span className="revision-value-caption">
                                                Current
                                            </span>

                                            <strong className="revision-old-value">
                                                {displayValue(
                                                    change.field,
                                                    change.oldValue
                                                )}
                                            </strong>
                                        </div>

                                        <div className="revision-arrow">
                                            <Icon icon="mdi:arrow-right" />
                                        </div>

                                        <div>
                                            <span className="revision-value-caption">
                                                New
                                            </span>

                                            <strong className="revision-new-value">
                                                {displayValue(
                                                    change.field,
                                                    change.newValue
                                                )}
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {modalMessage && (
                            <div
                                className={`savings-message ${modalMessageType}`}
                            >
                                <Icon
                                    icon={
                                        modalMessageType === "success"
                                            ? "mdi:check-circle-outline"
                                            : "mdi:alert-circle-outline"
                                    }
                                />

                                <span>{modalMessage}</span>
                            </div>
                        )}

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={() => setModalMode("edit")}
                                disabled={saving}
                            >
                                <Icon icon="mdi:arrow-left" />
                                Back to Edit
                            </button>

                            <button
                                type="button"
                                className="primary-button"
                                onClick={handleConfirmChanges}
                                disabled={saving}
                            >
                                <Icon icon="mdi:check-circle-outline" />
                                {saving ? "Saving..." : "Confirm Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalMode === "history" && (
                <div
                    className="modal-overlay"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                            closeModal();
                        }
                    }}
                >
                    <div
                        className="modal-card revision-modal-card history-modal-card"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="bill-history-title"
                    >
                        <div className="modal-header">
                            <div>
                                <p className="modal-eyebrow">VERSION TRACKING</p>

                                <h2 id="bill-history-title">
                                    Revision History
                                </h2>

                                <p>
                                    Previous changes made to this bill.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="modal-close"
                                onClick={closeModal}
                                aria-label="Close"
                            >
                                <Icon icon="mdi:close" />
                            </button>
                        </div>

                        {modalMessage && (
                            <div className={`savings-message ${modalMessageType}`}>
                                <Icon icon="mdi:alert-circle-outline" />
                                <span>{modalMessage}</span>
                            </div>
                        )}

                        {historyLoading ? (
                            <div className="revision-loading">
                                <Icon icon="mdi:loading" className="spin-icon" />
                                <span>Loading revision history...</span>
                            </div>
                        ) : revisions.length === 0 ? (
                            <div className="revision-empty">
                                <div className="revision-empty-icon">
                                    <Icon icon="mdi:history" />
                                </div>

                                <strong>No revisions yet</strong>

                                <span>
                                    This bill has not been edited.
                                </span>
                            </div>
                        ) : (
                            <div className="revision-history-list">
                                {revisions.map((revision) => (
                                    <div
                                        className="revision-history-item"
                                        key={revision._id}
                                    >
                                        <div className="revision-version">
                                            v{revision.version}
                                        </div>

                                        <div className="revision-history-content">
                                            <div className="revision-history-top">
                                                <strong>Changes saved</strong>

                                                <span>
                                                    {formatDate(
                                                        revision.createdAt
                                                    )}
                                                </span>
                                            </div>

                                            <div className="revision-history-changes">
                                                {revision.changes.map((change) => (
                                                    <div
                                                        className="revision-history-change"
                                                        key={`${revision._id}-${change.field}`}
                                                    >
                                                        <strong>
                                                            {change.field}
                                                        </strong>

                                                        <span>
                                                            {displayValue(
                                                                change.field,
                                                                change.oldValue
                                                            )}
                                                        </span>

                                                        <Icon icon="mdi:arrow-right" />

                                                        <span className="new">
                                                            {displayValue(
                                                                change.field,
                                                                change.newValue
                                                            )}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={closeModal}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Bills;