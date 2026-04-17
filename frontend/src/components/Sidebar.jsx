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

const drawerWidth = 260;

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
            theme.palette.mode === "dark" ? "#05070d" : "#ffffff",
          color: (theme) => theme.palette.text.primary,
          boxShadow: "none"
        }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 500 }}>
            HabitFlow
          </Typography>
          <Tooltip title={mode === "dark" ? "Light mode" : "Dark mode"}>
            <IconButton
              color="inherit"
              onClick={toggleColorMode}
              aria-label="toggle light or dark mode"
              sx={{ mr: 1 }}
            >
              {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
          <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
            {user.name.charAt(0).toUpperCase()}
          </Avatar>
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
              theme.palette.mode === "dark" ? "#0f172a" : "#ffffff",
            borderRight: (theme) =>
              theme.palette.mode === "dark"
                ? "1px solid #1e293b"
                : "1px solid #d5e6d6"
          }
        }}
      >
        <Toolbar />
        <Box sx={{ p: 2, display: "flex", alignItems: "center" }}>
          <Avatar sx={{ width: 40, height: 40, mr: 2 }}>
            {user.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="subtitle1">{user.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {user.email}
            </Typography>
          </Box>
        </Box>
        <Divider />
        <List>
          {items.map((item) => (
            <ListItem key={item.to} disablePadding>
              <ListItemButton
                component={RouterLink}
                to={item.to}
                selected={location.pathname === item.to}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Box sx={{ flexGrow: 1 }} />
        <Divider />
        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={onLogout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
    </>
  );
};

export default Sidebar;
