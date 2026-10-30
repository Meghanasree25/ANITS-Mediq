import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { Capacitor } from "@capacitor/core";

import TouchToTriageKiosk from "./pages/TouchToTriageKiosk";
import ClinicalQueuePage from "./pages/ClinicalQueuePage";
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
        {/* Core Touch-to-Triage Patient Mode Experience */}
        <Route
          path="/"
          element={<TouchToTriageKiosk />}
        />

        <Route
          path="/triage"
          element={<TouchToTriageKiosk />}
        />

        {/* Clinical Priority Queue & Staff Command Hub */}
        <Route
          path="/staff"
          element={<ClinicalQueuePage />}
        />

        <Route
          path="/queue"
          element={<ClinicalQueuePage />}
        />

        {/* Marketing / Hospital Info Landing */}
        <Route
          path="/landing"
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
              to="/"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
