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
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

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
    <Paper sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h5">Habits</Typography>
        <Typography variant="body2" color="text.secondary">
          Create and manage your habits, {user.name}.
        </Typography>

        <Grid container spacing={2} component="form" onSubmit={onSubmit}>
          <Grid item xs={12} md={4}>
            <TextField
              label="Habit Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ width: "100%" }}>
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
                sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
              >
                New
              </Button>
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Target per week"
              type="number"
              value={form.target_per_week}
              onChange={(e) =>
                setForm({ ...form, target_per_week: e.target.value })
              }
              fullWidth
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
            />
          </Grid>
          <Grid item xs={12} md={6}>
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
          <Grid item xs={12} md={6} sx={{ textAlign: { md: "right" } }}>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? "Saving..." : "Create Habit"}
            </Button>
          </Grid>
        </Grid>

        <Divider />

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Search habits"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={3}>
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
          <Grid item xs={12} md={3}>
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

        {error && <Typography color="error">{error}</Typography>}

        <List>
          {habits.map((habit) => (
            <ListItem
              key={habit.id}
              divider
              sx={{
                alignItems: "flex-start",
                flexDirection: { xs: "column", md: "row" },
                gap: 1
              }}
            >
              <Box sx={{ flex: 1, width: "100%" }}>
                <ListItemText
                  primary={habit.name}
                  secondary={
                    <>
                      {habit.description || "No description"}
                      <br />
                      Category: {habit.category || "None"} | Target:
                      {" "}
                      {habit.target_per_week ?? "N/A"} / week
                    </>
                  }
                />
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  width: { xs: "100%", md: "auto" },
                  justifyContent: { xs: "flex-end", md: "flex-start" },
                  flexWrap: "wrap"
                }}
              >
                {habit.is_active ? (
                  <Chip label="Active" size="small" color="success" />
                ) : (
                  <Chip label="Inactive" size="small" />
                )}
                <IconButton
                  aria-label="edit"
                  onClick={() => startEdit(habit)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  aria-label="delete"
                  onClick={() => openDeleteModal(habit)}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </ListItem>
          ))}
          {habits.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              No habits found.
            </Typography>
          )}
        </List>
      </Stack>
      <Dialog
        open={isEditModalOpen}
        onClose={closeEditModal}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Update Habit</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Habit Name"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              fullWidth
              required
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
              minRows={2}
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
        <DialogActions>
          <Button onClick={closeEditModal}>Cancel</Button>
          <Button variant="contained" onClick={onUpdateHabit} disabled={loading}>
            {loading ? "Updating..." : "Update Habit"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isCategoryModalOpen}
        onClose={closeCategoryModal}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>New category</DialogTitle>
        <DialogContent>
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCategoryModal}>Cancel</Button>
          <Button
            variant="contained"
            onClick={createCategory}
            disabled={categorySaving}
          >
            {categorySaving ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isDeleteModalOpen}
        onClose={closeDeleteModal}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Delete habit?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This will permanently delete
            {" "}
            <strong>{deleteTarget?.name || "this habit"}</strong>
            {" "}
            and its related check-ins.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteModal}>Cancel</Button>
          <Button color="error" variant="contained" onClick={deleteHabit}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default HabitsPage;
