import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";

const VerifyPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    const verifyEmail = async () => {
      try {
        const res = await axios.get(`/api/auth/verify?token=${token}`);
        setStatus("success");
        setMessage(res.data.message);
      } catch (err) {
        setStatus("error");
        setMessage(err?.response?.data?.error || "Verification failed.");
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <Container
      maxWidth="sm"
      sx={{ minHeight: "100vh", display: "flex", alignItems: "center" }}
    >
      <Paper elevation={3} sx={{ p: 4, width: "100%", textAlign: "center" }}>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Email Verification
        </Typography>

        {status === "loading" && (
          <Box sx={{ py: 4 }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Verifying your email...</Typography>
          </Box>
        )}

        {status === "success" && (
          <Box>
            <Alert severity="success" sx={{ mb: 3 }}>
              {message}
            </Alert>
            <Button
              variant="contained"
              onClick={() => navigate("/")}
              fullWidth
            >
              Go to Sign In
            </Button>
          </Box>
        )}

        {status === "error" && (
          <Box>
            <Alert severity="error" sx={{ mb: 3 }}>
              {message}
            </Alert>
            <Button
              variant="outlined"
              onClick={() => navigate("/")}
              fullWidth
            >
              Back to Home
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default VerifyPage;
