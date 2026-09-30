import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import axios from "axios";

function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                "http://localhost:5000/api/admin/users",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setUsers(response.data);
        } catch (error) {
            console.error(error);

            setError(
                error.response?.data?.message ||
                "Failed to load users."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleRoleChange = async (id, role) => {
        try {
            setError("");

            await axios.patch(
                `http://localhost:5000/api/admin/users/${id}/role`,
                { role },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setUsers((current) =>
                current.map((user) =>
                    user._id === id
                        ? { ...user, role }
                        : user
                )
            );
        } catch (error) {
            console.error(error);

            setError(
                error.response?.data?.message ||
                "Failed to update user role."
            );
        }
    };

    return (
        <div className="admin-feedback-page">

            <div className="feedback-header">

                <div>
                    <p className="eyebrow purple">
                        ADMINISTRATION
                    </p>

                    <h1>
                        User Management
                    </h1>

                    <p className="subtitle">
                        Manage PesoTrack users and their access roles.
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
                            Users
                        </h2>

                        <p>
                            Manage registered users and their system access.
                        </p>
                    </div>

                    <span className="feedback-count">
                        {users.length} registered user
                        {users.length !== 1 ? "s" : ""}
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
                            Loading users...
                        </h3>

                    </div>

                ) : users.length === 0 ? (

                    <div className="feedback-empty">

                        <div className="feedback-empty-icon">
                            <Icon icon="mdi:account-off-outline" />
                        </div>

                        <h3>
                            No users found
                        </h3>

                        <p>
                            Registered users will appear here.
                        </p>

                    </div>

                ) : (

                    <div className="feedback-list">

                        {users.map((user) => (

                            <div
                                className="feedback-item"
                                key={user._id}
                            >

                                <div className="feedback-item-icon">
                                    <Icon
                                        icon={
                                            user.role === "admin"
                                                ? "mdi:shield-account-outline"
                                                : "mdi:account-outline"
                                        }
                                    />
                                </div>

                                <div className="feedback-item-content">

                                    <div className="feedback-item-top">

                                        <div>
                                            <span className="feedback-type">
                                                REGISTERED USER
                                            </span>

                                            <h3>
                                                {user.name}
                                            </h3>
                                        </div>

                                        <span
                                            className={`feedback-status ${
                                                user.role === "admin"
                                                    ? "admin"
                                                    : "user"
                                            }`}
                                        >
                                            {user.role}
                                        </span>

                                    </div>

                                    <p className="admin-user-email">
                                        {user.email}
                                    </p>

                                    <div className="admin-feedback-footer">

                                        <div className="admin-feedback-action">

                                            <label>
                                                Access Role
                                            </label>

                                            <select
                                                className="admin-role-select"
                                                value={user.role}
                                                onChange={(e) =>
                                                    handleRoleChange(
                                                        user._id,
                                                        e.target.value
                                                    )
                                                }
                                            >
                                                <option value="user">
                                                    User
                                                </option>

                                                <option value="admin">
                                                    Admin
                                                </option>
                                            </select>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </section>

        </div>
    );
}

export default AdminUsers;