import { useEffect, useState } from "react";
import axios from "axios";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import ListItemSecondaryAction from "@mui/material/ListItemSecondaryAction";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const DashboardPage = ({ user }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/dashboard/summary", {
        params: { user_id: user.id }
      });
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async (habitId) => {
    try {
      await axios.post(`/api/habits/${habitId}/checkins`, {
        entry_date: new Date().toISOString().split("T")[0]
      });
      await loadSummary();
    } catch (err) {
      console.error("Failed to log check-in", err);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [user.id]);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">Dashboard</Typography>
          <Button variant="outlined" onClick={loadSummary} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </Stack>
      </Grid>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Total Habits
          </Typography>
          <Typography variant="h4">
            {data?.totals.total_habits ?? 0}
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Total Check-ins
          </Typography>
          <Typography variant="h4">
            {data?.totals.total_checkins ?? 0}
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Active Habits
          </Typography>
          <Typography variant="h4">
            {data?.totals.active_habits ?? 0}
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Avg Weekly Target
          </Typography>
          <Typography variant="h6">
            {data?.totals.avg_target_per_week ?? "N/A"} / week
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Last Check-in
          </Typography>
          <Typography variant="h6">
            {data?.totals.last_checkin_date ?? "No check-ins yet"}
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Weekly Progress
          </Typography>
          <List>
            {data?.weekly.map((row) => (
              <ListItem key={row.habit_id} divider>
                <ListItemText
                  primary={row.name}
                  secondary={
                    row.target_per_week
                      ? `Target ${row.target_per_week}/week · Actual ${row.actual_per_week}/week · ${row.completion_rate ?? 0}%`
                      : `Actual ${row.actual_per_week}/week`
                  }
                />
                <ListItemSecondaryAction>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => handleCheckin(row.habit_id)}
                    sx={{
                      borderRadius: "20px",
                      textTransform: "none",
                      background: (theme) =>
                        theme.palette.mode === "dark"
                          ? "linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)"
                          : "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                    }}
                  >
                    Complete
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            )) ?? (
              <Typography variant="body2" color="text.secondary">
                No habits yet. Create one from the Habits page.
              </Typography>
            )}
          </List>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default DashboardPage;
