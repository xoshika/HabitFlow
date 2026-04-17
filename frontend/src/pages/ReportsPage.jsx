import { useEffect, useState } from "react";
import axios from "axios";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";

const ReportsPage = ({ user }) => {
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const summary = {
    totalHabits: rows.length,
    activeHabits: rows.filter((r) => r.is_active).length,
    totalCheckins: rows.reduce((sum, r) => sum + (r.total_checkins || 0), 0),
    avgCompletion:
      rows.filter((r) => r.completion_rate !== null).length > 0
        ? (
            rows
              .filter((r) => r.completion_rate !== null)
              .reduce((sum, r) => sum + r.completion_rate, 0) /
            rows.filter((r) => r.completion_rate !== null).length
          ).toFixed(1)
        : null
  };

  const loadReports = async () => {
    const params = { user_id: user.id };
    if (search.trim()) {
      params.search = search.trim();
    }
    if (categoryId) {
      params.category_id = categoryId;
    }
    if (activeOnly) {
      params.is_active = true;
    }
    const res = await axios.get("/api/reports/habits", { params });
    setRows(res.data);
  };

  useEffect(() => {
    axios.get("/api/habit-categories").then((res) => setCategories(res.data));
  }, []);

  useEffect(() => {
    loadReports();
  }, [user.id, search, categoryId, activeOnly]);

  return (
    <Stack spacing={2}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Habit Reports
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Search habit or category"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              select
              fullWidth
            >
              <MenuItem value="">All categories</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={activeOnly}
                  onChange={(e) => setActiveOnly(e.target.checked)}
                />
              }
              label="Active only"
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Grid container spacing={2} sx={{ mb: 1 }}>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Habits in Report
              </Typography>
              <Typography variant="h5">{summary.totalHabits}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Active Habits
              </Typography>
              <Typography variant="h5">{summary.activeHabits}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Total Check-ins
              </Typography>
              <Typography variant="h5">{summary.totalCheckins}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Avg Completion
              </Typography>
              <Typography variant="h5">
                {summary.avgCompletion ? `${summary.avgCompletion}%` : "N/A"}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
        <List>
          {rows.map((row) => (
            <ListItem key={row.habit_id} divider sx={{ alignItems: "flex-start" }}>
              <ListItemText
                primary={row.habit_name}
                secondary={
                  <Box component="span" sx={{ display: "block" }}>
                    <Typography variant="body2" color="text.secondary" component="span" sx={{ display: "block" }}>
                      Category: {row.category_name ?? "Uncategorized"} | Target/week: {row.target_per_week ?? "N/A"} | Total check-ins: {row.total_checkins}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" component="span" sx={{ display: "block" }}>
                      Last 7 days: {row.checkins_last_7_days ?? 0} | Completion: {row.completion_rate ?? "N/A"}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary" component="span" sx={{ display: "block" }}>
                      Avg/day: {row.avg_per_day ?? 0} | First: {row.first_checkin ?? "N/A"} | Last: {row.last_checkin ?? "N/A"} | Period: {row.period_days ?? "N/A"} day(s)
                    </Typography>
                  </Box>
                }
              />
              {row.is_active ? (
                <Chip label="Active" size="small" color="success" />
              ) : (
                <Chip label="Inactive" size="small" />
              )}
            </ListItem>
          ))}
          {rows.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No report rows found for this filter.
            </Typography>
          )}
        </List>
      </Paper>
    </Stack>
  );
};

export default ReportsPage;
