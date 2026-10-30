
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { Capacitor } from "@capacitor/core";

import Landing from "./Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";

import PatientDashboard from "./pages/PatientDashboard";
import NurseDashboard from "./pages/NurseDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import PublicDisplay from "./pages/PublicDisplay";

import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  const isAndroidApp =
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === "android";

  return (
    <BrowserRouter>
      <Routes>
        {/* Home */}
        <Route
          path="/"
          element={
            isAndroidApp
              ? <Navigate to="/login" replace />
              : <Landing />
          }
        />

        {/* Authentication */}
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* Patient Dashboard */}
        <Route
          path="/patient"
          element={
            <ProtectedRoute allowedRole="patient">
              <PatientDashboard />
            </ProtectedRoute>
          }
        />

        {/* Website-only staff dashboards */}
        {!isAndroidApp && (
          <>
            <Route
              path="/nurse"
              element={
                <ProtectedRoute allowedRole="nurse">
                  <NurseDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/doctor"
              element={
                <ProtectedRoute allowedRole="doctor">
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/display"
              element={<PublicDisplay />}
            />
          </>
        )}

        {/* Unknown routes */}
        <Route
          path="*"
          element={
            <Navigate
              to={isAndroidApp ? "/login" : "/"}
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
