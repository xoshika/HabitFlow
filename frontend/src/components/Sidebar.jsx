import { Link as RouterLink, useLocation } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ListAltIcon from "@mui/icons-material/ListAlt";
import BarChartIcon from "@mui/icons-material/BarChart";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { useColorMode } from "../ColorModeContext";

const drawerWidth = 280;

const Sidebar = ({ user, onLogout }) => {
  const location = useLocation();
  const { mode, toggleColorMode } = useColorMode();

  const items = [
    { label: "Dashboard", icon: <DashboardIcon />, to: "/dashboard" },
    { label: "Habits", icon: <ListAltIcon />, to: "/habits" },
    { label: "Reports", icon: <BarChartIcon />, to: "/reports" },
    { label: "Profile", icon: <PersonIcon />, to: "/profile" }
  ];

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: (theme) =>
            theme.palette.mode === "dark" 
              ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" 
              : "linear-gradient(135deg, #ffffff 0%, #f8fbf8 100%)",
          color: (theme) => theme.palette.text.primary,
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 2px 8px rgba(0, 0, 0, 0.4)"
              : "0 2px 8px rgba(0, 0, 0, 0.1)",
          backdropFilter: "blur(10px)"
        }}
      >
        <Toolbar>
          <Typography 
            variant="h6" 
            sx={{ 
              flexGrow: 1, 
              fontWeight: 700,
              fontSize: "1.4rem",
              color: (theme) =>
                theme.palette.mode === "dark"
                  ? "#86efac"
                  : "#ffffff"
            }}
          >
            HabitFlow
          </Typography>
          <Tooltip title={mode === "dark" ? "Light mode" : "Dark mode"}>
            <IconButton
              color="inherit"
              onClick={toggleColorMode}
              aria-label="toggle light or dark mode"
              sx={{ 
                mr: 2,
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "scale(1.1)"
                }
              }}
            >
              {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: (theme) =>
              theme.palette.mode === "dark" ? "#0f172a" : "#f8fbf8",
            borderRight: (theme) =>
              theme.palette.mode === "dark"
                ? "1px solid #1e293b"
                : "1px solid #e2e8f0",
            overflow: "hidden"
          }
        }}
      >
        <Toolbar />
        <Box 
          sx={{ 
            p: 3, 
            display: "flex", 
            alignItems: "center",
            background: (theme) =>
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.4) 100%)"
                : "linear-gradient(135deg, rgba(248, 251, 248, 0.8) 0%, rgba(226, 232, 240, 0.4) 100%)",
            borderRadius: "12px",
            margin: 2,
            border: (theme) =>
              theme.palette.mode === "dark"
                ? "1px solid #1e293b"
                : "1px solid #e2e8f0"
          }}
        >
          <Avatar 
            sx={{ 
              width: 48, 
              height: 48, 
              mr: 2,
              background: (theme) =>
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, #86efac 0%, #22c55e 100%)"
                  : "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
              fontWeight: 700,
              fontSize: "1.3rem"
            }}
          >
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {user?.name || "User"}
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                opacity: 0.7,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "100%"
              }}
            >
      
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ opacity: 0.3 }} />
        <List sx={{ px: 1, py: 2 }}>
          {items.map((item) => (
            <ListItem key={item.to} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                component={RouterLink}
                to={item.to}
                selected={location.pathname === item.to}
                sx={{
                  borderRadius: "8px",
                  mx: 1,
                  transition: "all 0.3s ease",
                  "&.Mui-selected": {
                    background: (theme) =>
                      theme.palette.mode === "dark"
                        ? "linear-gradient(135deg, rgba(134, 239, 172, 0.2) 0%, rgba(34, 197, 94, 0.2) 100%)"
                        : "linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.1) 100%)",
                    color: (theme) =>
                      theme.palette.mode === "dark" ? "#86efac" : "#16a34a",
                    fontWeight: 600,
                    borderLeft: (theme) =>
                      `4px solid ${theme.palette.mode === "dark" ? "#22c55e" : "#16a34a"}`,
                    paddingLeft: "12px !important"
                  },
                  "&:hover": {
                    background: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(134, 239, 172, 0.1)"
                        : "rgba(34, 197, 94, 0.05)",
                    transform: "translateX(4px)"
                  },
                  "& .MuiListItemIcon-root": {
                    color: (theme) =>
                      location.pathname === item.to
                        ? theme.palette.mode === "dark" ? "#86efac" : "#16a34a"
                        : "inherit",
                    minWidth: 40
                  }
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText 
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: "0.95rem" }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Box sx={{ flexGrow: 1 }} />
        <Divider sx={{ opacity: 0.3 }} />
        <List sx={{ px: 1, py: 2 }}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={onLogout}
              sx={{
                borderRadius: "8px",
                mx: 1,
                transition: "all 0.3s ease",
                color: (theme) =>
                  theme.palette.mode === "dark" ? "#fb7185" : "#dc2626",
                "&:hover": {
                  background: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(251, 113, 133, 0.1)"
                      : "rgba(220, 38, 38, 0.05)",
                  transform: "translateX(4px)"
                },
                "& .MuiListItemIcon-root": {
                  color: (theme) =>
                    theme.palette.mode === "dark" ? "#fb7185" : "#dc2626",
                  minWidth: 40
                }
              }}
            >
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Logout"
                primaryTypographyProps={{ fontSize: "0.95rem" }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
    </>
  );
};

export default Sidebar;
