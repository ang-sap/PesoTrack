import { useState } from "react";
import axios from "axios";

function Login() {
    const [isRegistering, setIsRegistering] = useState(false);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [message, setMessage] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setSuccess(false);

        try {
            if (isRegistering) {
                const response = await axios.post(
                    "http://localhost:5000/api/auth/register",
                    {
                        name,
                        email,
                        password
                    }
                );

                setMessage(
                    response.data.message ||
                    "Account created successfully."
                );

                setSuccess(true);

                setName("");
                setEmail("");
                setPassword("");

                setTimeout(() => {
                    setIsRegistering(false);
                    setMessage("");
                    setSuccess(false);
                }, 1500);

            } else {
                const response = await axios.post(
                    "http://localhost:5000/api/auth/login",
                    {
                        email,
                        password
                    }
                );

                localStorage.setItem(
                    "token",
                    response.data.token
                );

                localStorage.setItem(
                    "user",
                    JSON.stringify(response.data.user)
                );

                window.location.href = "/";
            }

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                (isRegistering
                    ? "Registration failed"
                    : "Login failed")
            );

            setSuccess(false);
        }
    };

    const switchMode = () => {
        setIsRegistering(!isRegistering);
        setName("");
        setEmail("");
        setPassword("");
        setMessage("");
        setSuccess(false);
    };

    return (
        <div className="auth-page">
            <div className="auth-card">

                <div className="auth-logo">
                    <span>₱</span>
                </div>

                <h1>
                    {isRegistering
                        ? "Create your account"
                        : "Welcome to PesoTrack"}
                </h1>

                <p className="auth-subtitle">
                    {isRegistering
                        ? "Start managing your money in one place."
                        : "Manage your money in one place."}
                </p>


                <form onSubmit={handleSubmit}>

                    {isRegistering && (
                        <>
                            <label>Name</label>

                            <input
                                type="text"
                                placeholder="Enter your name"
                                value={name}
                                onChange={(e) =>
                                    setName(e.target.value)
                                }
                                required
                            />
                        </>
                    )}


                    <label>Email</label>

                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                        required
                    />


                    <label>Password</label>

                    <input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                        required
                        minLength={6}
                    />


                    {message && (
                        <p
                            className={
                                success
                                    ? "auth-success"
                                    : "auth-error"
                            }
                        >
                            {message}
                        </p>
                    )}


                    <button
                        type="submit"
                        className="auth-button"
                    >
                        {isRegistering
                            ? "Create account"
                            : "Login"}
                    </button>

                </form>


                <p className="auth-footer">
                    {isRegistering
                        ? "Already have an account?"
                        : "Don't have an account?"}{" "}

                    <span
                        onClick={switchMode}
                        style={{ cursor: "pointer" }}
                    >
                        {isRegistering
                            ? "Login"
                            : "Create an account"}
                    </span>
                </p>

            </div>
        </div>
    );
}

export default Login;