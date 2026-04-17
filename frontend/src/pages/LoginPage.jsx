import { useState } from "react";
import axios from "axios";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";

const LoginPage = ({ onLogin }) => {
  const [authMode, setAuthMode] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const endpoint =
        authMode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const payload =
        authMode === "signup"
          ? { name: name.trim(), email, password }
          : { email, password };
      const res = await axios.post(endpoint, payload);
      onLogin(res.data.user);
    } catch (err) {
      setError(err?.response?.data?.error || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{ minHeight: "100vh", display: "flex", alignItems: "center" }}
    >
      <Paper elevation={3} sx={{ p: 4, width: "100%" }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
          {authMode === "signup"
            ? "Create your account"
            : "Sign in to Habit Tracker"}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {authMode === "signup"
            ? "Register to create and manage your own habits."
            : "Use the demo credentials pre-filled below."}
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {authMode === "signup" && (
              <TextField
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                required
              />
            )}
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
            />
            {error && (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            )}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
            >
              {loading
                ? authMode === "signup"
                  ? "Creating account..."
                  : "Signing in..."
                : authMode === "signup"
                  ? "Sign up"
                  : "Sign in"}
            </Button>
            <Button
              type="button"
              variant="text"
              onClick={() => {
                setError(null);
                setAuthMode(authMode === "signup" ? "signin" : "signup");
              }}
            >
              {authMode === "signup"
                ? "Already have an account? Sign in"
                : "New here? Create an account"}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;
