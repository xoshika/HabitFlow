import { useEffect, useState } from "react";
import axios from "axios";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Alert from "@mui/material/Alert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import { useTheme } from "@mui/material/styles";

const defaultForm = {
  name: "",
  description: "",
  category_id: "",
  target_per_week: "",
  is_active: true
};

const HabitsPage = ({ user }) => {
  const [habits, setHabits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [form, setForm] = useState(defaultForm);
  const [editingHabitId, setEditingHabitId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(defaultForm);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categorySaving, setCategorySaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const theme = useTheme();

  const loadCategories = async () => {
    const res = await axios.get("/api/habit-categories");
    setCategories(res.data);
  };

  const loadHabits = async () => {
    const params = {
      user_id: user.id
    };
    if (search.trim()) {
      params.search = search.trim();
    }
    if (filterActiveOnly) {
      params.is_active = true;
    }
    if (filterCategoryId) {
      params.category_id = filterCategoryId;
    }
    const res = await axios.get("/api/habits", { params });
    setHabits(res.data);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadHabits();
  }, [user.id, search, filterActiveOnly, filterCategoryId]);

  const resetForm = () => {
    setForm(defaultForm);
    setError(null);
  };

  const closeEditModal = () => {
    setEditingHabitId(null);
    setEditForm(defaultForm);
    setIsEditModalOpen(false);
    setError(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        user_id: user.id,
        name: form.name.trim(),
        description: form.description.trim(),
        category_id: form.category_id ? Number(form.category_id) : null,
        target_per_week:
          form.target_per_week === "" ? null : Number(form.target_per_week),
        is_active: form.is_active
      };

      if (!payload.name) {
        setError("Habit name is required");
        setLoading(false);
        return;
      }

      await axios.post("/api/habits", payload);
      resetForm();
      await loadHabits();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to save habit");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (habit) => {
    setEditingHabitId(habit.id);
    setEditForm({
      name: habit.name || "",
      description: habit.description || "",
      category_id: habit.category_id ?? "",
      target_per_week: habit.target_per_week ?? "",
      is_active: Boolean(habit.is_active)
    });
    setIsEditModalOpen(true);
    setError(null);
  };

  const onUpdateHabit = async () => {
    if (!editingHabitId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        category_id: editForm.category_id ? Number(editForm.category_id) : null,
        target_per_week:
          editForm.target_per_week === ""
            ? null
            : Number(editForm.target_per_week),
        is_active: editForm.is_active
      };

      if (!payload.name) {
        setError("Habit name is required");
        setLoading(false);
        return;
      }

      await axios.put(`/api/habits/${editingHabitId}`, payload);
      closeEditModal();
      await loadHabits();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to update habit");
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (habit) => {
    setDeleteTarget(habit);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    setIsDeleteModalOpen(false);
  };
  const handleCheckin = async (habitId) => {
    try {
      await axios.post(`/api/habits/${habitId}/checkins`, {
        entry_date: new Date().toISOString().split("T")[0]
      });
      // Optionally reload habits or show success
      await loadHabits();
    } catch (err) {
      setError("Failed to log check-in");
    }
  };

  const deleteHabit = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`/api/habits/${deleteTarget.id}`);
      if (editingHabitId === deleteTarget.id) closeEditModal();
      closeDeleteModal();
      await loadHabits();
    } catch (err) {
      setError("Failed to delete habit");
    }
  };

  const openCategoryModal = () => {
    setNewCategoryName("");
    setIsCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setNewCategoryName("");
  };

  const createCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      setError("Category name is required");
      return;
    }
    setCategorySaving(true);
    setError(null);
    try {
      const res = await axios.post("/api/habit-categories", { name });
      await loadCategories();
      setForm({ ...form, category_id: String(res.data.id) });
      closeCategoryModal();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to create category");
    } finally {
      setCategorySaving(false);
    }
  };

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
          <FitnessCenterIcon sx={{ fontSize: 32 }} />
          Your Habits
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track and manage your daily habits to build a better routine
        </Typography>
      </Box>

      {/* Create Habit Section */}
      <Paper 
        component="form" 
        onSubmit={onSubmit}
        sx={{ 
          p: 3,
          background: (theme) =>
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.3) 100%)"
              : "linear-gradient(135deg, rgba(248, 251, 248, 0.8) 0%, rgba(226, 232, 240, 0.4) 100%)",
          backdropFilter: "blur(10px)",
          border: (theme) =>
            theme.palette.mode === "dark"
              ? "1px solid rgba(96, 165, 250, 0.1)"
              : "1px solid rgba(37, 99, 235, 0.1)"
        }}
      >
        <Stack spacing={3}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Create New Habit
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="Habit Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                fullWidth
                variant="outlined"
                placeholder="e.g., Morning Exercise"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Stack direction="row" spacing={1} alignItems="flex-end" sx={{ height: "100%" }}>
                <TextField
                  label="Category"
                  value={form.category_id}
                  onChange={(e) =>
                    setForm({ ...form, category_id: e.target.value })
                  }
                  fullWidth
                  select
                >
                  <MenuItem value="">None</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </TextField>
                <Button
                  type="button"
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={openCategoryModal}
                  sx={{ flexShrink: 0, whiteSpace: "nowrap", height: 56 }}
                >
                  New
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="Target per week"
                type="number"
                value={form.target_per_week}
                onChange={(e) =>
                  setForm({ ...form, target_per_week: e.target.value })
                }
                fullWidth
                placeholder="e.g., 5"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                fullWidth
                multiline
                minRows={2}
                placeholder="Add a description for your habit..."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_active}
                    onChange={(e) =>
                      setForm({ ...form, is_active: e.target.checked })
                    }
                  />
                }
                label="Active"
              />
            </Grid>
            <Grid item xs={12} sm={6} sx={{ display: "flex", justifyContent: { xs: "flex-start", sm: "flex-end" } }}>
              <Button 
                type="submit" 
                variant="contained" 
                disabled={loading}
                size="large"
                sx={{ 
                  background: (theme) =>
                    theme.palette.mode === "dark"
                      ? "linear-gradient(135deg, #86efac 0%, #22c55e 100%)"
                      : "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                  color: (theme) =>
                    theme.palette.mode === "dark" ? "#0f172a" : "#ffffff",
                  fontWeight: 600,
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: (theme) =>
                      theme.palette.mode === "dark"
                        ? "0 8px 16px rgba(134, 239, 172, 0.3)"
                        : "0 8px 16px rgba(34, 197, 94, 0.3)"
                  },
                  transition: "all 0.3s ease"
                }}
              >
                {loading ? "Saving..." : "Create Habit"}
              </Button>
            </Grid>
          </Grid>
        </Stack>
      </Paper>

      <Divider sx={{ opacity: 0.3 }} />

      {/* Filter Section */}
      <Paper 
        sx={{ 
          p: 2.5,
          background: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(15, 23, 42, 0.3)"
              : "rgba(248, 251, 248, 0.5)"
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Search habits"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
              placeholder="Search by name..."
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Category filter"
              value={filterCategoryId}
              onChange={(e) => setFilterCategoryId(e.target.value)}
              fullWidth
              select
            >
              <MenuItem value="">All categories</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={filterActiveOnly}
                  onChange={(e) => setFilterActiveOnly(e.target.checked)}
                />
              }
              label="Active only"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Habits Grid */}
      {habits.length === 0 ? (
        <Paper 
          sx={{ 
            p: 4,
            textAlign: "center",
            background: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(15, 23, 42, 0.3)"
                : "rgba(248, 251, 248, 0.5)",
            border: (theme) =>
              `2px dashed ${theme.palette.mode === "dark" ? "rgba(96, 165, 250, 0.2)" : "rgba(37, 99, 235, 0.2)"}`
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 48, opacity: 0.3, mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No habits found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Create your first habit to get started on your journey!
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {habits.map((habit) => (
            <Grid item xs={12} sm={6} md={4} key={habit.id}>
              <Card 
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 0.3s ease",
                  background: (theme) =>
                    theme.palette.mode === "dark"
                      ? "linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.4) 100%)"
                      : "linear-gradient(135deg, rgba(248, 251, 248, 0.8) 0%, rgba(226, 232, 240, 0.4) 100%)",
                  border: (theme) =>
                    theme.palette.mode === "dark"
                      ? "1px solid rgba(96, 165, 250, 0.1)"
                      : "1px solid rgba(37, 99, 235, 0.1)",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: (theme) =>
                      theme.palette.mode === "dark"
                        ? "0 12px 24px rgba(96, 165, 250, 0.2)"
                        : "0 12px 24px rgba(37, 99, 235, 0.15)",
                    borderColor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(96, 165, 250, 0.3)"
                        : "rgba(37, 99, 235, 0.2)"
                  }
                }}
              >
                <CardContent sx={{ pb: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "start", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
                      {habit.name}
                    </Typography>
                    {habit.is_active ? (
                      <Chip 
                        label="Active" 
                        size="small" 
                        color="success"
                        sx={{ ml: 1 }}
                      />
                    ) : (
                      <Chip 
                        label="Inactive" 
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Box>
                  {habit.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
                      {habit.description}
                    </Typography>
                  )}
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
                    {habit.category && (
                      <Chip 
                        label={`${habit.category}`} 
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {habit.target_per_week && (
                      <Chip 
                        label={`${habit.target_per_week}x/week`} 
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </CardContent>
                <CardActions sx={{ mt: "auto", justifyContent: "space-between", pt: 1, px: 2, pb: 2 }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => handleCheckin(habit.id)}
                    disabled={!habit.is_active}
                    sx={{
                      borderRadius: "20px",
                      textTransform: "none",
                      fontWeight: 600,
                      background: (theme) =>
                        theme.palette.mode === "dark"
                          ? "linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)"
                          : "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                      boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
                      "&:hover": {
                        transform: "scale(1.05)",
                        boxShadow: "0 6px 16px rgba(37, 99, 235, 0.3)"
                      }
                    }}
                  >
                    Complete
                  </Button>
                  <Box>
                    <IconButton
                      aria-label="edit"
                      onClick={() => startEdit(habit)}
                      size="small"
                      sx={{
                        transition: "all 0.2s ease",
                        "&:hover": {
                          backgroundColor: (theme) =>
                            theme.palette.mode === "dark"
                              ? "rgba(96, 165, 250, 0.1)"
                              : "rgba(37, 99, 235, 0.1)",
                          color: (theme) =>
                            theme.palette.mode === "dark" ? "#60a5fa" : "#2563eb"
                        }
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      aria-label="delete"
                      onClick={() => openDeleteModal(habit)}
                      size="small"
                      sx={{
                        transition: "all 0.2s ease",
                        "&:hover": {
                          backgroundColor: "rgba(239, 68, 68, 0.1)",
                          color: "#ef4444"
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Edit Modal */}
      <Dialog
        open={isEditModalOpen}
        onClose={closeEditModal}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            background: (theme) =>
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
                : "linear-gradient(135deg, #ffffff 0%, #f8fbf8 100%)"
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.3rem" }}>
          Update Habit
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Stack spacing={2.5}>
            <TextField
              label="Habit Name"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              fullWidth
              required
              variant="outlined"
            />
            <TextField
              label="Category"
              value={editForm.category_id}
              onChange={(e) =>
                setEditForm({ ...editForm, category_id: e.target.value })
              }
              fullWidth
              select
            >
              <MenuItem value="">None</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Target per week"
              type="number"
              value={editForm.target_per_week}
              onChange={(e) =>
                setEditForm({ ...editForm, target_per_week: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Description"
              value={editForm.description}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
              fullWidth
              multiline
              minRows={3}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={editForm.is_active}
                  onChange={(e) =>
                    setEditForm({ ...editForm, is_active: e.target.checked })
                  }
                />
              }
              label="Active"
            />
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeEditModal} variant="outlined">
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={onUpdateHabit} 
            disabled={loading}
            sx={{
              background: (theme) =>
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, #86efac 0%, #22c55e 100%)"
                  : "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
              color: (theme) =>
                theme.palette.mode === "dark" ? "#0f172a" : "#ffffff",
              fontWeight: 600
            }}
          >
            {loading ? "Updating..." : "Update Habit"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Category Modal */}
      <Dialog
        open={isCategoryModalOpen}
        onClose={closeCategoryModal}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            background: (theme) =>
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
                : "linear-gradient(135deg, #ffffff 0%, #f8fbf8 100%)"
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          New Category
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Category name"
            fullWidth
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                createCategory();
              }
            }}
            variant="outlined"
          />
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeCategoryModal} variant="outlined">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={createCategory}
            disabled={categorySaving}
          >
            {categorySaving ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Modal */}
      <Dialog
        open={isDeleteModalOpen}
        onClose={closeDeleteModal}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            background: (theme) =>
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
                : "linear-gradient(135deg, #ffffff 0%, #f8fbf8 100%)"
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#ef4444" }}>
          Delete Habit?
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            This will permanently delete
            {" "}
            <strong>"{deleteTarget?.name || "this habit"}"</strong>
            {" "}
            and its related check-ins.
          </Typography>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeDeleteModal} variant="outlined">
            Cancel
          </Button>
          <Button 
            color="error" 
            variant="contained" 
            onClick={deleteHabit}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default HabitsPage;
