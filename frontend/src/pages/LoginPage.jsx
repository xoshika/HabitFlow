import { useState } from "react";
import axios from "axios";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";

const LoginPage = ({ onLogin }) => {
  const [authMode, setAuthMode] = useState("signin");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const endpoint =
        authMode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const payload =
        authMode === "signup"
          ? {
              first_name: firstName.trim(),
              middle_name: middleName.trim(),
              last_name: lastName.trim(),
              email,
              password,
            }
          : { email, password };
      const res = await axios.post(endpoint, payload);
      
      if (authMode === "signup") {
        setSuccess("Account created! Please check your inbox for the verification link to activate your account.");
        setFirstName("");
        setMiddleName("");
        setLastName("");
        setEmail("");
        setPassword("");
        setAuthMode("signin");
      } else {
        onLogin(res.data.user);
      }
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
            : "HabitFlow"}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {authMode === "signup"
            ? "Register to create and manage your own habits."
            : "Welcome back! Please sign in to continue tracking your habits."}
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {authMode === "signup" && (
              <>
                <TextField
                  label="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  fullWidth
                  required
                />
                <TextField
                  label="Middle Name"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  fullWidth
                  required
                />
              </>
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
            {success && (
              <Alert severity="success" variant="outlined">
                {success}
              </Alert>
            )}
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
                setSuccess(null);
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
