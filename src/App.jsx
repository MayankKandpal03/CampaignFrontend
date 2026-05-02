import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import useAuthStore from "./stores/useAuthStore";
import Login from "./pages/LoginPage";
import PPCDashboard from "./pages/PPCDashboard";
import PMDashboard from "./pages/PMDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import ITDashboard from "./pages/ITDashboard";

const ROLE_ROUTES = {
  ppc:               "/ppc-dashboard",
  manager:           "/manager-dashboard",
  "process manager": "/pm-dashboard",
  it:                "/it-dashboard",
};

function App() {
  const { isAuth, role } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        {/* If already logged in, /login redirects to their dashboard */}
        <Route
          path="/login"
          element={
            isAuth
              ? <Navigate to={ROLE_ROUTES[role] || "/login"} />
              : <Login />
          }
        />

        <Route path="/ppc-dashboard" element={
          <ProtectedRoute allowedRoles={["ppc"]}>
            <PPCDashboard />
          </ProtectedRoute>
        }/>
        <Route path="/pm-dashboard" element={
          <ProtectedRoute allowedRoles={["process manager"]}>
            <PMDashboard />
          </ProtectedRoute>
        }/>
        <Route path="/manager-dashboard" element={
          <ProtectedRoute allowedRoles={["manager"]}>
            <ManagerDashboard />
          </ProtectedRoute>
        }/>
        <Route path="/it-dashboard" element={
          <ProtectedRoute allowedRoles={["it"]}>
            <ITDashboard />
          </ProtectedRoute>
        }/>

        {/* Any unknown/unauthorized URL → dashboard if logged in, else login */}
        <Route
          path="*"
          element={
            isAuth
              ? <Navigate to={ROLE_ROUTES[role] || "/login"} />
              : <Navigate to="/login" />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;