import { BrowserRouter, Routes, Route } from "react-router-dom";
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


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/login" element={<Login />} />
        <Route path="/leader/:id" element={<LeaderProfile />} />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/leaders"
          element={
            <AdminRoute>
              <AdminLeaders />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/districts"
          element={
            <AdminRoute>
              <AdminDistricts />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/projects"
          element={
            <AdminRoute>
              <AdminProjects />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/complaints"
          element={
            <AdminRoute>
              <AdminComplaints />
            </AdminRoute>
          }
        />

        <Route
  path="/admin/users"
  element={
    <AdminRoute>
      <AdminUsers />
    </AdminRoute>
  }
/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;