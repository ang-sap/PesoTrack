import { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const EMPTY_FORM = {
    billId: "",
    amount: "",
    method: "Cash",
    proof: null
};

function formatCurrency(value) {
    const amount = Number(value || 0);

    return `₱${amount.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

function formatDate(value) {
    if (!value) return "No date";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "No date";
    }

    return date.toLocaleDateString();
}

function Payments() {
    const [bills, setBills] = useState([]);
    const [payments, setPayments] = useState([]);

    const [modalMode, setModalMode] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [selectedBill, setSelectedBill] = useState(null);

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [modalMessage, setModalMessage] = useState("");
    const [modalMessageType, setModalMessageType] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const headers = () => ({
        Authorization: `Bearer ${localStorage.getItem("token")}`
    });

    const fetchData = async () => {
        try {
            const [billResponse, paymentResponse] = await Promise.all([
                axios.get(
                    "http://localhost:5000/api/bills",
                    { headers: headers() }
                ),
                axios.get(
                    "http://localhost:5000/api/payments",
                    { headers: headers() }
                )
            ]);

            setBills(billResponse.data);
            setPayments(paymentResponse.data);
        } catch {
            setMessage("Failed to load payment data.");
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const unpaidBills = bills.filter(
        (bill) => bill.status === "unpaid"
    );

    const openRecordModal = () => {
        setForm(EMPTY_FORM);
        setSelectedBill(null);
        setModalMessage("");
        setModalMessageType("");
        setMessage("");
        setMessageType("");
        setModalMode("record");
    };

    const closeModal = () => {
        if (saving) return;

        if (form.proof) {
            form.proof = null;
        }

        setModalMode(null);
        setForm(EMPTY_FORM);
        setSelectedBill(null);
        setModalMessage("");
        setModalMessageType("");
        setSaving(false);
    };

    const handleBillChange = (e) => {
        const bill = unpaidBills.find(
            (item) => item._id === e.target.value
        );

        setSelectedBill(bill || null);

        setForm((current) => ({
            ...current,
            billId: e.target.value,
            amount: bill ? bill.amount : ""
        }));
    };

    const handleProofChange = (e) => {
        const file = e.target.files?.[0] || null;

        if (!file) {
            setForm((current) => ({
                ...current,
                proof: null
            }));
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/pdf"
        ];

        if (!allowedTypes.includes(file.type)) {
            setModalMessage(
                "Please upload a JPG, PNG, WEBP, or PDF file."
            );
            setModalMessageType("error");
            e.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setModalMessage(
                "Proof of payment must be 5 MB or smaller."
            );
            setModalMessageType("error");
            e.target.value = "";
            return;
        }

        setForm((current) => ({
            ...current,
            proof: file
        }));

        setModalMessage("");
        setModalMessageType("");
    };

    const openReview = () => {
        if (!selectedBill) {
            setModalMessage("Please select an unpaid bill.");
            setModalMessageType("error");
            return;
        }

        if (!form.proof) {
            setModalMessage("Please attach proof of payment.");
            setModalMessageType("error");
            return;
        }

        setModalMessage("");
        setModalMessageType("");
        setModalMode("review");
    };

    const handleConfirmPayment = async () => {
        if (!selectedBill || !form.proof) {
            return;
        }

        try {
            setSaving(true);
            setModalMessage("");
            setModalMessageType("");

            const data = new FormData();

            data.append("billId", form.billId);
            data.append("amount", String(Number(form.amount)));
            data.append("method", form.method);
            data.append("proof", form.proof);

            await axios.post(
                "http://localhost:5000/api/payments",
                data,
                {
                    headers: {
                        ...headers(),
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            setModalMessage(
                "Payment confirmed. The bill is now marked as paid."
            );
            setModalMessageType("success");

            await fetchData();

            setTimeout(() => {
                closeModal();

                setMessage(
                    "Payment confirmed successfully. The bill is now marked as paid."
                );
                setMessageType("success");

                setTimeout(() => {
                    setMessage("");
                    setMessageType("");
                }, 3000);
            }, 900);
        } catch (error) {
            setModalMessage(
                error.response?.data?.message ||
                "Failed to confirm payment."
            );
            setModalMessageType("error");
        } finally {
            setSaving(false);
        }
    };

    const resetToRecord = () => {
        setModalMode("record");
        setModalMessage("");
        setModalMessageType("");
    };

    const openProof = (payment) => {
        const proofUrl = payment.proofOfPayment?.url;

        if (!proofUrl) {
            setMessage("No proof of payment is attached to this record.");
            setMessageType("error");
            return;
        }

        window.open(
            `http://localhost:5000${proofUrl}`,
            "_blank",
            "noopener,noreferrer"
        );
    };

    const renderRecordForm = () => (
        <>
            <div className="form-group">
                <label>Bill</label>

                <select
                    value={form.billId}
                    onChange={handleBillChange}
                    required
                >
                    <option value="">
                        Select an unpaid bill
                    </option>

                    {unpaidBills.map((bill) => (
                        <option
                            key={bill._id}
                            value={bill._id}
                        >
                            {bill.title} — {formatCurrency(bill.amount)}
                        </option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label>Payment Amount</label>

                <input
                    type="number"
                    value={form.amount}
                    readOnly
                    placeholder="Select a bill"
                />
            </div>

            <div className="form-group">
                <label>Payment Method</label>

                <select
                    value={form.method}
                    onChange={(e) =>
                        setForm((current) => ({
                            ...current,
                            method: e.target.value
                        }))
                    }
                >
                    <option value="Cash">Cash</option>
                    <option value="GCash">GCash</option>
                    <option value="Maya">Maya</option>
                    <option value="Bank Transfer">
                        Bank Transfer
                    </option>
                </select>
            </div>

            <div className="form-group">
                <label>Proof of Payment</label>

                <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    onChange={handleProofChange}
                    required
                />

                <span className="input-help">
                    JPG, PNG, WEBP, or PDF · Maximum 5 MB
                </span>

                {form.proof && (
                    <div className="proof-selected">
                        <div className="proof-selected-icon">
                            <Icon icon="mdi:file-check-outline" />
                        </div>

                        <div>
                            <strong>{form.proof.name}</strong>
                            <span>
                                {(form.proof.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                        </div>

                        <button
                            type="button"
                            className="icon-action-button"
                            onClick={() =>
                                setForm((current) => ({
                                    ...current,
                                    proof: null
                                }))
                            }
                            aria-label="Remove proof"
                            title="Remove proof"
                        >
                            <Icon icon="mdi:close" />
                        </button>
                    </div>
                )}
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
                                PAYMENT CENTER
                            </p>

                            <h1>Payments</h1>

                            <p className="subtitle">
                                Record, review, and confirm bill payments with proof of payment.
                            </p>
                        </div>

                        <button
                            className="primary-button"
                            onClick={openRecordModal}
                        >
                            <Icon icon="mdi:plus" />
                            Record payment
                        </button>
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

                    <section className="panel payment-history-panel">
                        <div className="panel-header">
                            <div>
                                <h2>Payment history</h2>

                                <p>
                                    Confirmed payments and their proof of payment.
                                </p>
                            </div>

                            <span className="count-pill">
                                {payments.length}
                            </span>
                        </div>

                        {loading ? (
                            <div className="empty-state">
                                Loading payments...
                            </div>
                        ) : payments.length === 0 ? (
                            <div className="empty-state">
                                <Icon icon="mdi:credit-card-clock-outline" />

                                <strong>No payments yet</strong>

                                <span>
                                    Confirmed payments will appear here.
                                </span>
                            </div>
                        ) : (
                            <div className="modern-list">
                                {payments.map((payment) => (
                                    <div
                                        className="finance-row payment-row-uniform"
                                        key={payment._id}
                                    >
                                        <div className="finance-icon income">
                                            <Icon icon="mdi:check" />
                                        </div>

                                        <div className="finance-main">
                                            <strong>
                                                {payment.billId?.title ||
                                                    "Bill payment"}
                                            </strong>

                                            <span>
                                                {payment.method} ·{" "}
                                                {formatDate(
                                                    payment.paymentDate
                                                )}
                                            </span>
                                        </div>

                                        <div className="finance-meta">
                                            <strong className="income">
                                                +{formatCurrency(payment.amount)}
                                            </strong>

                                            <span className="status paid">
                                                PAID
                                            </span>
                                        </div>

                                        <div className="transaction-actions">
                                            <button
                                                type="button"
                                                className="secondary-button compact-button"
                                                onClick={() =>
                                                    openProof(payment)
                                                }
                                                disabled={
                                                    !payment.proofOfPayment?.url
                                                }
                                                title={
                                                    payment.proofOfPayment?.url
                                                        ? "View proof of payment"
                                                        : "No proof attached"
                                                }
                                            >
                                                <Icon icon="mdi:file-eye-outline" />
                                                View proof
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>

            {modalMode === "record" && (
                <div
                    className="modal-overlay"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget && !saving) {
                            closeModal();
                        }
                    }}
                >
                    <div
                        className="modal-card payment-proof-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="payment-record-title"
                    >
                        <div className="modal-header">
                            <div>
                                <p className="modal-eyebrow">
                                    PAYMENT DETAILS
                                </p>

                                <h2 id="payment-record-title">
                                    Record Payment
                                </h2>

                                <p>
                                    Enter the payment details and attach proof before reviewing.
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

                        {unpaidBills.length === 0 ? (
                            <>
                                <div className="savings-message error">
                                    <Icon icon="mdi:information-outline" />

                                    <span>
                                        There are no unpaid bills available for payment.
                                    </span>
                                </div>

                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="secondary-button"
                                        onClick={closeModal}
                                    >
                                        Close
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                {renderRecordForm()}

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

                                <div className="payment-review-note">
                                    <Icon icon="mdi:shield-check-outline" />

                                    <span>
                                        The bill will stay unpaid until you confirm the payment in the next step.
                                    </span>
                                </div>

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
                                        Review Payment
                                    </button>
                                </div>
                            </>
                        )}
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
                        className="modal-card payment-proof-modal review-payment-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="payment-review-title"
                    >
                        <div className="modal-header">
                            <div>
                                <p className="modal-eyebrow">
                                    REVIEW BEFORE SAVE
                                </p>

                                <h2 id="payment-review-title">
                                    Review Payment
                                </h2>

                                <p>
                                    Check the payment details and proof before confirming.
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

                        <div className="payment-review-grid">
                            <div className="payment-review-item">
                                <span>Bill</span>
                                <strong>
                                    {selectedBill?.title || "—"}
                                </strong>
                            </div>

                            <div className="payment-review-item">
                                <span>Amount</span>
                                <strong>
                                    {formatCurrency(form.amount)}
                                </strong>
                            </div>

                            <div className="payment-review-item">
                                <span>Payment method</span>
                                <strong>{form.method}</strong>
                            </div>

                            <div className="payment-review-item">
                                <span>Proof of payment</span>
                                <strong>
                                    {form.proof?.name || "No file"}
                                </strong>
                            </div>
                        </div>

                        <div className="payment-review-warning">
                            <Icon icon="mdi:alert-circle-outline" />

                            <div>
                                <strong>Confirm carefully</strong>

                                <span>
                                    Confirming this payment will mark the bill as paid and update the related financial records.
                                </span>
                            </div>
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
                                onClick={resetToRecord}
                                disabled={saving}
                            >
                                <Icon icon="mdi:arrow-left" />
                                Back to Payment
                            </button>

                            <button
                                type="button"
                                className="primary-button"
                                onClick={handleConfirmPayment}
                                disabled={saving}
                            >
                                <Icon icon="mdi:check-circle-outline" />
                                {saving
                                    ? "Confirming..."
                                    : "Confirm Payment"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Payments;