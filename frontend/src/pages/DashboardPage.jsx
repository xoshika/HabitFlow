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
