import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  Link,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(
        err.message || "Failed to sign in. Please check your credentials."
      );
      console.error("Login error:", err);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "80vh",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: "400px",
          width: "100%",
        }}
      >
        <Typography variant="h5" component="h1" gutterBottom>
          Sign In
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 3, mb: 2 }}
          >
            Sign In
          </Button>
        </form>

        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Typography variant="body2">
            Don't have an account?{" "}
            <Link component={RouterLink} to="/register">
              Register here
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
