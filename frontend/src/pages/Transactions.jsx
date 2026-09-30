import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import Sidebar from "../components/sidebar";
import Topbar from "../components/Topbar";

const EMPTY_FORM = { type: "expense", category: "", amount: "", description: "", date: "" };
const EDITABLE_FIELDS = [
    { key: "type", label: "Type" },
    { key: "category", label: "Category" },
    { key: "amount", label: "Amount" },
    { key: "description", label: "Description" },
    { key: "date", label: "Date" }
];

function formatDateInput(value) {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
}

function formatDate(value) {
    if (!value) return "No date";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "No date" : date.toLocaleDateString();
}

function formatCurrency(value) {
    return `₱${Number(value || 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

function displayValue(field, value) {
    if (value === null || value === undefined || value === "") return "None";
    if (field === "amount") return formatCurrency(value);
    if (field === "date") return formatDate(value);
    if (field === "type") return String(value).charAt(0).toUpperCase() + String(value).slice(1);
    return String(value);
}

function getChanges(original, updated) {
    return EDITABLE_FIELDS.filter(({ key }) => {
        if (key === "amount") return Number(original[key]) !== Number(updated[key]);
        if (key === "date") return formatDateInput(original[key]) !== formatDateInput(updated[key]);
        return String(original[key] ?? "") !== String(updated[key] ?? "");
    }).map(({ key, label }) => ({ field: key, label, oldValue: original[key], newValue: updated[key] }));
}

function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const [modalMode, setModalMode] = useState(null);
    const [activeTransaction, setActiveTransaction] = useState(null);
    const [originalForm, setOriginalForm] = useState(EMPTY_FORM);
    const [form, setForm] = useState(EMPTY_FORM);
    const [revisions, setRevisions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [modalMessage, setModalMessage] = useState("");
    const [modalMessageType, setModalMessageType] = useState("");
    const [saving, setSaving] = useState(false);
    const changes = useMemo(() => getChanges(originalForm, form), [originalForm, form]);

    const fetchTransactions = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("http://localhost:5000/api/transactions", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTransactions(response.data);
        } catch (error) {
            setMessage("Failed to load transactions.");
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTransactions(); }, []);

    const handleChange = (e) => {
        setForm((current) => ({ ...current, [e.target.name]: e.target.value }));
    };

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setOriginalForm(EMPTY_FORM);
        setActiveTransaction(null);
        setModalMessage("");
        setModalMessageType("");
        setSaving(false);
    };

    const openAddModal = () => {
        resetForm();
        setMessage("");
        setMessageType("");
        setModalMode("add");
    };

    const closeModal = () => {
        setModalMode(null);
        resetForm();
    };

    const openEditModal = (transaction) => {
        const editForm = {
            type: transaction.type || "expense",
            category: transaction.category || "",
            amount: String(transaction.amount ?? ""),
            description: transaction.description || "",
            date: formatDateInput(transaction.date)
        };
        setActiveTransaction(transaction);
        setOriginalForm(editForm);
        setForm(editForm);
        setModalMessage("");
        setModalMessageType("");
        setMessage("");
        setMessageType("");
        setModalMode("edit");
    };

    const openHistoryModal = async (transaction) => {
        setActiveTransaction(transaction);
        setRevisions([]);
        setHistoryLoading(true);
        setModalMessage("");
        setModalMessageType("");
        setModalMode("history");
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `http://localhost:5000/api/revisions/Transaction/${transaction._id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setRevisions(response.data);
        } catch (error) {
            setModalMessage(error.response?.data?.message || "Failed to load revision history.");
            setModalMessageType("error");
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setModalMessage("");
            setModalMessageType("");
            const token = localStorage.getItem("token");
            await axios.post(
                "http://localhost:5000/api/transactions",
                { ...form, amount: Number(form.amount) },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setModalMessage("Transaction added successfully.");
            setModalMessageType("success");
            await fetchTransactions();
            setTimeout(closeModal, 700);
        } catch (error) {
            setModalMessage(error.response?.data?.message || "Failed to add transaction.");
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
        if (!activeTransaction || changes.length === 0) return;
        try {
            setSaving(true);
            setModalMessage("");
            setModalMessageType("");
            const token = localStorage.getItem("token");
            const response = await axios.patch(
                `http://localhost:5000/api/transactions/${activeTransaction._id}`,
                {
                    type: form.type,
                    category: form.category,
                    amount: Number(form.amount),
                    description: form.description,
                    date: form.date
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTransactions((current) => current.map((item) => item._id === activeTransaction._id ? response.data.transaction : item));
            setModalMessage("Changes confirmed successfully.");
            setModalMessageType("success");
            setTimeout(() => {
                closeModal();
                setMessage("Transaction updated successfully.");
                setMessageType("success");
                setTimeout(() => { setMessage(""); setMessageType(""); }, 2500);
            }, 700);
        } catch (error) {
            setModalMessage(error.response?.data?.message || "Failed to update transaction.");
            setModalMessageType("error");
        } finally {
            setSaving(false);
        }
    };

    const renderFormFields = () => (
        <>
            <div className="form-group">
                <label>Transaction Type</label>
                <select name="type" value={form.type} onChange={handleChange} required>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                </select>
            </div>
            <div className="form-group">
                <label>Category</label>
                <input name="category" value={form.category} onChange={handleChange} placeholder="e.g. Food, Salary" required />
            </div>
            <div className="form-group">
                <label>Amount</label>
                <input type="number" name="amount" value={form.amount} onChange={handleChange} placeholder="0.00" min="0.01" step="0.01" required />
            </div>
            <div className="form-group">
                <label>Description</label>
                <input name="description" value={form.description} onChange={handleChange} placeholder="Optional" />
            </div>
            <div className="form-group">
                <label>Date</label>
                <input type="date" name="date" value={form.date} onChange={handleChange} />
            </div>
        </>
    );

    return (
        <div className="app">
            <Sidebar />
            <main className="main-content">
                <Topbar />
                <div className="page-content">
                    <div className="welcome">
                        <div>
                            <p className="eyebrow purple">FINANCIAL ACTIVITY</p>
                            <h1>Transactions</h1>
                            <p className="subtitle">Manage your income and expenses.</p>
                        </div>
                        <button className="primary-button" onClick={openAddModal}>
                            <Icon icon="mdi:plus" />
                            Add transaction
                        </button>
                    </div>

                    {message && (
                        <div className={`savings-message ${messageType}`}>
                            <Icon icon={messageType === "success" ? "mdi:check-circle-outline" : "mdi:alert-circle-outline"} />
                            <span>{message}</span>
                        </div>
                    )}

                    <section className="panel transactions-panel">
                        <div className="panel-header">
                            <div>
                                <h2>Transaction History</h2>
                                <p>Edit records, review changes, or view revision history.</p>
                            </div>
                            <span className="count-pill">{transactions.length}</span>
                        </div>

                        {loading ? (
                            <div className="empty-state">Loading transactions...</div>
                        ) : transactions.length === 0 ? (
                            <div className="empty-state">
                                <Icon icon="mdi:swap-horizontal-circle-outline" />
                                <strong>No transactions yet</strong>
                                <span>Add your first transaction to start tracking your money.</span>
                            </div>
                        ) : (
                            <div className="modern-list">
                                {transactions.map((transaction) => (
                                    <div className="finance-row revision-ready-row" key={transaction._id}>
                                        <div className={`finance-icon ${transaction.type}`}>
                                            <Icon
                                                icon={
                                                    transaction.type === "income"
                                                        ? "mdi:cash-plus"
                                                        : "mdi:receipt-text-outline"
                                                }
                                            />
                                        </div>

                                        <div className="finance-main">
                                            <strong>{transaction.category}</strong>
                                            <span>
                                                {transaction.description || "No description"}
                                                <span className="transaction-date-inline">
                                                    {formatDate(transaction.date)}
                                                </span>
                                            </span>
                                        </div>

                                        <div className="finance-meta">
                                            <strong className={transaction.type}>
                                                {transaction.type === "income" ? "+" : "-"}
                                                ₱{Number(transaction.amount).toLocaleString("en-PH", {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2
                                                })}
                                            </strong>

                                            <span className={`transaction-type-label ${transaction.type}`}>
                                                {transaction.type}
                                            </span>
                                        </div>

                                        <div className="transaction-actions">
                                            <button
                                                type="button"
                                                className="icon-action-button"
                                                onClick={() => openHistoryModal(transaction)}
                                                title="View revision history"
                                                aria-label="View revision history"
                                            >
                                                <Icon icon="mdi:history" />
                                            </button>

                                            <button
                                                type="button"
                                                className="secondary-button compact-button"
                                                onClick={() => openEditModal(transaction)}
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
                <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) closeModal(); }}>
                    <div className="modal-card revision-modal-card" role="dialog" aria-modal="true">
                        <div className="modal-header">
                            <div>
                                <p className="modal-eyebrow">NEW RECORD</p>
                                <h2>Create Transaction</h2>
                                <p>Add income or expense to your transaction history.</p>
                            </div>
                            <button type="button" className="modal-close" onClick={closeModal} disabled={saving} aria-label="Close"><Icon icon="mdi:close" /></button>
                        </div>
                        <form onSubmit={handleAddSubmit}>
                            {renderFormFields()}
                            {modalMessage && (
                                <div className={`savings-message ${modalMessageType}`}>
                                    <Icon icon={modalMessageType === "success" ? "mdi:check-circle-outline" : "mdi:alert-circle-outline"} />
                                    <span>{modalMessage}</span>
                                </div>
                            )}
                            <div className="modal-actions">
                                <button type="button" className="secondary-button" onClick={closeModal} disabled={saving}>Cancel</button>
                                <button type="submit" className="primary-button" disabled={saving}><Icon icon="mdi:check" />{saving ? "Saving..." : "Add Transaction"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {modalMode === "edit" && (
                <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) closeModal(); }}>
                    <div className="modal-card revision-modal-card" role="dialog" aria-modal="true">
                        <div className="modal-header">
                            <div>
                                <p className="modal-eyebrow">EDIT RECORD</p>
                                <h2>Edit Transaction</h2>
                                <p>Update the details, then review the changes before saving.</p>
                            </div>
                            <button type="button" className="modal-close" onClick={closeModal} disabled={saving} aria-label="Close"><Icon icon="mdi:close" /></button>
                        </div>
                        {renderFormFields()}
                        {modalMessage && (
                            <div className={`savings-message ${modalMessageType}`}>
                                <Icon icon={modalMessageType === "success" ? "mdi:check-circle-outline" : "mdi:alert-circle-outline"} />
                                <span>{modalMessage}</span>
                            </div>
                        )}
                        <div className="modal-actions">
                            <button type="button" className="secondary-button" onClick={closeModal} disabled={saving}>Cancel</button>
                            <button type="button" className="primary-button" onClick={openReview} disabled={saving}><Icon icon="mdi:eye-outline" />Review Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {modalMode === "review" && (
                <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) closeModal(); }}>
                    <div className="modal-card revision-modal-card review-modal-card" role="dialog" aria-modal="true">
                        <div className="modal-header">
                            <div>
                                <p className="modal-eyebrow">REVIEW BEFORE SAVE</p>
                                <h2>Review Changes</h2>
                                <p>Check the old and new values before confirming the update.</p>
                            </div>
                            <button type="button" className="modal-close" onClick={closeModal} disabled={saving} aria-label="Close"><Icon icon="mdi:close" /></button>
                        </div>
                        <div className="review-summary-box">
                            <div className="review-summary-icon"><Icon icon="mdi:file-edit-outline" /></div>
                            <div>
                                <strong>{activeTransaction?.category}</strong>
                                <span>{changes.length} field{changes.length !== 1 ? "s" : ""} will be updated.</span>
                            </div>
                        </div>
                        <div className="revision-change-list">
                            {changes.map((change) => (
                                <div className="revision-change-card" key={change.field}>
                                    <div className="revision-change-label">{change.label}</div>
                                    <div className="revision-value-grid">
                                        <div>
                                            <span className="revision-value-caption">Current</span>
                                            <strong className="revision-old-value">{displayValue(change.field, change.oldValue)}</strong>
                                        </div>
                                        <div className="revision-arrow"><Icon icon="mdi:arrow-right" /></div>
                                        <div>
                                            <span className="revision-value-caption">New</span>
                                            <strong className="revision-new-value">{displayValue(change.field, change.newValue)}</strong>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {modalMessage && (
                            <div className={`savings-message ${modalMessageType}`}>
                                <Icon icon={modalMessageType === "success" ? "mdi:check-circle-outline" : "mdi:alert-circle-outline"} />
                                <span>{modalMessage}</span>
                            </div>
                        )}
                        <div className="modal-actions">
                            <button type="button" className="secondary-button" onClick={() => setModalMode("edit")} disabled={saving}><Icon icon="mdi:arrow-left" />Back to Edit</button>
                            <button type="button" className="primary-button" onClick={handleConfirmChanges} disabled={saving}><Icon icon="mdi:check-circle-outline" />{saving ? "Saving..." : "Confirm Changes"}</button>
                        </div>
                    </div>
                </div>
            )}

            {modalMode === "history" && (
                <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
                    <div className="modal-card revision-modal-card history-modal-card" role="dialog" aria-modal="true">
                        <div className="modal-header">
                            <div>
                                <p className="modal-eyebrow">VERSION TRACKING</p>
                                <h2>Revision History</h2>
                                <p>Previous changes made to this transaction.</p>
                            </div>
                            <button type="button" className="modal-close" onClick={closeModal} aria-label="Close"><Icon icon="mdi:close" /></button>
                        </div>
                        {modalMessage && (
                            <div className={`savings-message ${modalMessageType}`}>
                                <Icon icon="mdi:alert-circle-outline" />
                                <span>{modalMessage}</span>
                            </div>
                        )}
                        {historyLoading ? (
                            <div className="revision-loading"><Icon icon="mdi:loading" className="spin-icon" /><span>Loading revision history...</span></div>
                        ) : revisions.length === 0 ? (
                            <div className="revision-empty">
                                <div className="revision-empty-icon"><Icon icon="mdi:history" /></div>
                                <strong>No revisions yet</strong>
                                <span>This transaction has not been edited.</span>
                            </div>
                        ) : (
                            <div className="revision-history-list">
                                {revisions.map((revision) => (
                                    <div className="revision-history-item" key={revision._id}>
                                        <div className="revision-version">v{revision.version}</div>
                                        <div className="revision-history-content">
                                            <div className="revision-history-top">
                                                <strong>Changes saved</strong>
                                                <span>{formatDate(revision.createdAt)}</span>
                                            </div>
                                            <div className="revision-history-changes">
                                                {revision.changes.map((change) => (
                                                    <div className="revision-history-change" key={`${revision._id}-${change.field}`}>
                                                        <strong>{change.field}</strong>
                                                        <span>{displayValue(change.field, change.oldValue)}</span>
                                                        <Icon icon="mdi:arrow-right" />
                                                        <span className="new">{displayValue(change.field, change.newValue)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="modal-actions"><button type="button" className="secondary-button" onClick={closeModal}>Close</button></div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Transactions;