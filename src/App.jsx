import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { GuestRoute } from "./components/GuestRoute";
import AppLayout from "./components/Layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import BatchProcessing from "./pages/BatchProcessing";
import Reporting from "./pages/Reporting";
import AdminUsers from "./pages/admin/Users";
import AdminLogs from "./pages/admin/Logs";
import AdminSettings from "./pages/admin/Settings";

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="batch" element={<BatchProcessing />} />
        <Route path="reporting" element={<Reporting />} />
        <Route
          path="admin/users"
          element={
            <ProtectedRoute adminOnly>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/logs"
          element={
            <ProtectedRoute adminOnly>
              <AdminLogs />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/settings"
          element={
            <ProtectedRoute adminOnly>
              <AdminSettings />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
