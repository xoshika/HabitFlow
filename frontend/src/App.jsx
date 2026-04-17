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
    return <LoginPage onLogin={setUser} />;
  }

  return (
    <Box display="flex">
      <Sidebar user={user} onLogout={() => setUser(null)} />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage user={user} />} />
          <Route path="/habits" element={<HabitsPage user={user} />} />
          <Route path="/reports" element={<ReportsPage user={user} />} />
          <Route path="/profile" element={<ProfilePage user={user} />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;
