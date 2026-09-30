import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";

import Login from "./pages/Login";
import Transactions from "./pages/Transactions";
import Bills from "./pages/Bills";
import Payments from "./pages/Payments";
import Notifications from "./pages/Notifications";
import SavingsGoals from "./pages/SavingsGoals";
import Feedback from "./pages/Feedback";
import AdminUsers from "./pages/AdminUsers";
import AuditLogs from "./pages/AuditLogs";
import AdminFeedback from "./pages/AdminFeedback";
import Sidebar from "./components/Sidebar";


function UserRoute({ children }) {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (user?.role === "admin") {
        return <Navigate to="/admin/users" replace />;
    }

    return children;
}


function AdminRoute({ children }) {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (user?.role !== "admin") {
        return <Navigate to="/" replace />;
    }

    return children;
}


function AppLayout() {
    return (
        <div className="app">

            <Sidebar />

            <main className="main-content">

                <div className="page-content">
                    <Outlet />
                </div>

            </main>

        </div>
    );
}




function App() {

    return (

        <BrowserRouter>

            <Routes>

                <Route
                    path="/login"
                    element={<Login />}
                />


                <Route
                    path="/"
                    element={
                        <UserRoute>
                            <Dashboard />
                        </UserRoute>
                    }
                />


                <Route
                    path="/transactions"
                    element={
                        <UserRoute>
                            <Transactions />
                        </UserRoute>
                    }
                />


                <Route
                    path="/bills"
                    element={
                        <UserRoute>
                            <Bills />
                        </UserRoute>
                    }
                />


                <Route
                    path="/payments"
                    element={
                        <UserRoute>
                            <Payments />
                        </UserRoute>
                    }
                />


                <Route
                    path="/notifications"
                    element={
                        <UserRoute>
                            <Notifications />
                        </UserRoute>
                    }
                />


                <Route
                    path="/feedback"
                    element={
                        <UserRoute>
                            <Feedback />
                        </UserRoute>
                    }
                />


                <Route
                    element={
                        <UserRoute>
                            <AppLayout />
                        </UserRoute>
                    }
                >
                    <Route
                        path="/savings-goals"
                        element={<SavingsGoals />}
                    />
                </Route>


                <Route
                    element={
                        <AdminRoute>
                            <AppLayout />
                        </AdminRoute>
                    }
                >

                    <Route
                        path="/admin/users"
                        element={<AdminUsers />}
                    />


                    <Route
                        path="/admin/audit-logs"
                        element={<AuditLogs />}
                    />


                    <Route
                        path="/admin/feedback"
                        element={<AdminFeedback />}
                    />

                </Route>


                <Route
                    path="*"
                    element={<Navigate to="/" replace />}
                />

            </Routes>

        </BrowserRouter>

    );
}


export default App;