import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import HabitsPage from "./pages/HabitsPage";
import ReportsPage from "./pages/ReportsPage";
import ProfilePage from "./pages/ProfilePage";
import Sidebar from "./components/Sidebar";
import VerifyPage from "./pages/VerifyPage";

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("habit_tracker_user");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("habit_tracker_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("habit_tracker_user");
    }
  }, [user]);

  if (!user) {
    return (
      <Routes>
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="*" element={<LoginPage onLogin={setUser} />} />
      </Routes>
    );
  }

  return (
    <Box display="flex">
      <Sidebar user={user} onLogout={() => setUser(null)} />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          background: (theme) =>
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, #05070d 0%, #0f172a 50%, #1e293b 100%)"
              : "linear-gradient(135deg, #f8fbf8 0%, #f1f5f3 50%, #e8f0ed 100%)",
          minHeight: "100vh",
          backgroundAttachment: "fixed"
        }}
      >
        <Toolbar />
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage user={user} />} />
            <Route path="/habits" element={<HabitsPage user={user} />} />
            <Route path="/reports" element={<ReportsPage user={user} />} />
            <Route path="/profile" element={<ProfilePage user={user} />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
}

export default App;
