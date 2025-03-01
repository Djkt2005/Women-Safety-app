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

const Register = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }

    try {
      setError("");
      await register(formData.email, formData.password);
      navigate("/onboarding");
    } catch (err: any) {
      setError(err.message || "Failed to create an account");
      console.error("Registration error:", err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
      <Paper elevation={3} sx={{ p: 4, maxWidth: "400px", width: "100%" }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Create Account
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
            name="email"
            fullWidth
            margin="normal"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <TextField
            label="Password"
            type="password"
            name="password"
            fullWidth
            margin="normal"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <TextField
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            fullWidth
            margin="normal"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 3, mb: 2 }}
          >
            Register
          </Button>
        </form>

        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Typography variant="body2">
            Already have an account?{" "}
            <Link component={RouterLink} to="/login">
              Sign in here
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Register;
