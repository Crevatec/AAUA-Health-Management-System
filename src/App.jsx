import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { roleHomePath } from "./routes/roleHomePath";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";

import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import CompleteProfile from "./pages/auth/CompleteProfile";

import AdminOverview from "./pages/admin/AdminOverview";
import UsersManagement from "./pages/admin/UsersManagement";
import FacultiesManagement from "./pages/admin/FacultiesManagement";
import ReportsPage from "./pages/admin/ReportsPage";
import AuditLogViewer from "./pages/admin/AuditLogViewer";
import ClinicSettings from "./pages/admin/ClinicSettings";
import StaffOverview from "./pages/medical-staff/StaffOverview";
import StudentOverview from "./pages/student/StudentOverview";
import LecturerOverview from "./pages/lecturer/LecturerOverview";

import PatientSearch from "./pages/medical-staff/PatientSearch";
import PatientProfile from "./pages/medical-staff/PatientProfile";
import NewVisit from "./pages/medical-staff/NewVisit";
import ClinicVisitsList from "./pages/medical-staff/ClinicVisitsList";
import AddMedication from "./pages/medical-staff/AddMedication";
import AddLabRequest from "./pages/medical-staff/AddLabRequest";
import MedicationsList from "./pages/medical-staff/MedicationsList";
import LabList from "./pages/medical-staff/LabList";
import LabRequestDetail from "./pages/medical-staff/LabRequestDetail";
import StaffAppointments from "./pages/medical-staff/StaffAppointments";
import VisitDetail from "./pages/shared/VisitDetail";
import MyRecords from "./pages/shared/MyRecords";
import BookAppointment from "./pages/shared/BookAppointment";
import MyAppointments from "./pages/shared/MyAppointments";
import NotificationsInbox from "./pages/shared/NotificationsInbox";
import MyProfile from "./pages/shared/MyProfile";

import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

export default function App() {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-light dark:bg-surface-dark">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-clinic-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public / auth routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to={roleHomePath(role)} replace /> : <Login />}
      />
      <Route
        path="/signup"
        element={isAuthenticated ? <Navigate to={roleHomePath(role)} replace /> : <Signup />}
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/complete-profile" element={<CompleteProfile />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Administrator */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["administrator"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminOverview />} />
        <Route path="users" element={<UsersManagement />} />
        <Route path="faculties" element={<FacultiesManagement />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="audit" element={<AuditLogViewer />} />
        <Route path="settings" element={<ClinicSettings />} />
        <Route path="notifications" element={<NotificationsInbox />} />
      </Route>

      {/* Medical staff */}
      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRoles={["medical_staff"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StaffOverview />} />
        <Route path="patients" element={<PatientSearch />} />
        <Route path="patients/:patientId" element={<PatientProfile />} />
        <Route path="visits" element={<ClinicVisitsList />} />
        <Route path="visits/new" element={<NewVisit />} />
        <Route path="visits/:visitId" element={<VisitDetail />} />
        <Route path="visits/:visitId/medications" element={<AddMedication />} />
        <Route path="visits/:visitId/lab-request" element={<AddLabRequest />} />
        <Route path="medications" element={<MedicationsList />} />
        <Route path="lab" element={<LabList />} />
        <Route path="lab/:labId" element={<LabRequestDetail />} />
        <Route path="appointments" element={<StaffAppointments />} />
        <Route path="notifications" element={<NotificationsInbox />} />
      </Route>

      {/* Students */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentOverview />} />
        <Route path="records" element={<MyRecords />} />
        <Route path="records/:visitId" element={<VisitDetail />} />
        <Route path="appointments" element={<MyAppointments />} />
        <Route path="appointments/book" element={<BookAppointment />} />
        <Route path="notifications" element={<NotificationsInbox />} />
        <Route path="profile" element={<MyProfile />} />
      </Route>

      {/* Lecturers */}
      <Route
        path="/lecturer"
        element={
          <ProtectedRoute allowedRoles={["lecturer"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<LecturerOverview />} />
        <Route path="records" element={<MyRecords />} />
        <Route path="records/:visitId" element={<VisitDetail />} />
        <Route path="appointments" element={<MyAppointments />} />
        <Route path="appointments/book" element={<BookAppointment />} />
        <Route path="notifications" element={<NotificationsInbox />} />
        <Route path="profile" element={<MyProfile />} />
      </Route>

      {/* Root redirect */}
      <Route
        path="/"
        element={
          isAuthenticated ? <Navigate to={roleHomePath(role)} replace /> : <Navigate to="/login" replace />
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
