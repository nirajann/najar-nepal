import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Projects from "./pages/Projects";
import Ranking from "./pages/Ranking";
import Login from "./pages/Login";
import LeaderProfile from "./pages/LeaderProfile";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminLeaders from "./components/admin/AdminLeaders";
import AdminDistricts from "./components/admin/AdminDistricts";
import AdminProjects from "./components/admin/AdminProjects";
import AdminComplaints from "./components/admin/AdminComplaints";
import AdminUsers from "./components/admin/AdminUsers";
import Profile from "./pages/Profile";
import VerificationPage from "./pages/VerificationPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/login" element={<Login />} />
        <Route path="/leader/:id" element={<LeaderProfile />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/profile" element={<Profile />} />

        <Route
          path="/verification"
          element={
            <ProtectedRoute>
              <VerificationPage />
            </ProtectedRoute>
          }
        />

        <Route path="/admin" element={<AdminRoute />}>
          <Route index element={<AdminDashboard />} />
          <Route path="leaders" element={<AdminLeaders />} />
          <Route path="districts" element={<AdminDistricts />} />
          <Route path="projects" element={<AdminProjects />} />
          <Route path="complaints" element={<AdminComplaints />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
